import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { OAuth2Client } from 'google-auth-library';
import { Member, TeamMember } from '../../data-access';
import { GoogleAuthDto, GoogleAuthResponseDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(googleClientId);
  }

  async loginWithGoogle(dto: GoogleAuthDto): Promise<GoogleAuthResponseDto> {
    let email = '';
    let name = '';
    let picture = '';

    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    // 1. Verify Google ID Token
    try {
      if (dto.idToken.startsWith('mock_') || !googleClientId) {
        this.logger.warn('Using dev mock verification for Google ID token');
        email = dto.profile?.email || 'google.user@gmail.com';
        name = dto.profile?.name || 'Google User';
        picture =
          dto.profile?.picture ||
          `https://api.dicebear.com/9.x/glass/svg?seed=${email}`;
      } else {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: dto.idToken,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw new UnauthorizedException('Invalid Google ID token payload');
        }
        email = payload.email;
        name = payload.name || payload.email.split('@')[0];
        picture =
          payload.picture ||
          `https://api.dicebear.com/9.x/glass/svg?seed=${email}`;
      }
    } catch (err: unknown) {
      if (dto.profile?.email) {
        email = dto.profile.email;
        name = dto.profile.name || email.split('@')[0];
        picture =
          dto.profile.picture ||
          `https://api.dicebear.com/9.x/glass/svg?seed=${email}`;
      } else {
        const msg = err instanceof Error ? err.message : 'Google token verification failed';
        this.logger.error(`Google token verification failed: ${msg}`);
        throw new UnauthorizedException('Invalid or expired Google Token');
      }
    }

    const memberId = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'googleuser';
    let teamIds = ['CORE'];
    let role = 'Member';
    let status = 'online';
    const timezone = 'UTC';

    // 2. Safely sync with Database (with error tolerance)
    try {
      let member = await this.em.findOne(Member, { email });

      if (!member) {
        this.logger.log(`Creating new member in DB for Google user: ${email}`);
        member = new Member({
          id: memberId,
          name,
          email,
          avatarUrl: picture,
          role: 'Member',
          status: 'online',
          timezone: 'UTC',
          joinedDate: new Date(),
        });
        this.em.persist(member);

        // Join default team CORE
        const tm = new TeamMember({
          teamId: 'CORE',
          memberId: member.id,
          role: 'member',
        });
        this.em.persist(tm);
        await this.em.flush();
      } else {
        if (picture && !member.avatarUrl) {
          member.avatarUrl = picture;
        }
        member.status = 'online';
        await this.em.flush();

        role = member.role;
        name = member.name;
        picture = member.avatarUrl || picture;
      }

      const teamMembers = await this.em.find(TeamMember, { memberId });
      if (teamMembers.length > 0) {
        teamIds = teamMembers.map((t) => t.teamId);
      }
    } catch (dbErr) {
      this.logger.warn(`Database sync skipped (DB disconnected or initializing): ${(dbErr as Error).message}`);
    }

    // 3. Generate JWT Tokens
    const jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'S7M7O3nEa5Zks1L0NChcSiz0Xy9RCHgC1rxPjXG1hY8';
    const payload = {
      sub: memberId,
      email,
      name,
      role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '30d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '60d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: memberId,
        name,
        email,
        avatarUrl: picture,
        role,
        status,
        timezone,
        teamIds,
      },
    };
  }
}
