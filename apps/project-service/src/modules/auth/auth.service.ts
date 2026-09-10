import { hashData, verifyHashed } from '@app/common';
import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import {
  AuthResponseDto,
  GoogleAuthDto,
  GoogleAuthResponseDto,
  LoginDto,
  SignUpDto,
  WorkspaceResponseDto,
} from './auth.dto';
import { Member, TeamMember, Workspace, WorkspaceMember } from '../../data-access';

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

  private signTokenPair(payload: {
    sub: string;
    email: string;
    name: string;
    role: string;
  }): {
    accessToken: string;
    refreshToken: string;
  } {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return {
      accessToken: this.jwtService.sign(payload, { secret: jwtSecret, expiresIn: '30d' }),
      refreshToken: this.jwtService.sign(payload, {
        secret: jwtSecret,
        expiresIn: '60d',
      }),
    };
  }

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    if (!email || !name || !dto.password) {
      throw new BadRequestException('Please provide full name, email, and password');
    }

    const existingMember = await this.em.findOne(Member, { email });
    if (existingMember) {
      throw new ConflictException(
        'An account with this email address already exists. Please log in.',
      );
    }

    const baseMemberId =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'user';
    let memberId = baseMemberId;
    let counter = 1;
    // oxlint-disable-next-line no-await-in-loop -- each candidate id depends on the previous one being taken
    while (await this.em.findOne(Member, { id: memberId })) {
      memberId = `${baseMemberId}${counter}`;
      counter++;
    }

    const passwordHash = await hashData(dto.password);
    const avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(email)}`;
    const member = new Member({
      id: memberId,
      name,
      email,
      avatarUrl,
      passwordHash,
      role: 'Admin',
      status: 'online',
      timezone: 'UTC',
      joinedDate: new Date(),
    });
    this.em.persist(member);
    await this.em.flush();

    this.logger.log(
      `Created new member account [${member.email}] without auto-provisioning workspace`,
    );

    const { accessToken, refreshToken } = this.signTokenPair({
      sub: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        avatarUrl: member.avatarUrl,
        role: member.role,
        status: member.status,
        timezone: member.timezone,
        teamIds: [],
      },
      workspace: undefined,
      isNewUser: true,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const member = await this.em.findOne(Member, { email });

    if (
      !member ||
      !member.passwordHash ||
      !(await verifyHashed(dto.password, member.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    member.status = 'online';
    await this.em.flush();

    let userWorkspace: WorkspaceResponseDto | undefined;
    const membership = await this.em.findOne(WorkspaceMember, { memberId: member.id });
    if (membership) {
      const ws = await this.em.findOne(Workspace, { id: membership.workspaceId });
      if (ws) {
        userWorkspace = {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          icon: ws.icon,
          description: ws.description,
          role: membership.role,
          inviteCode: ws.inviteCode,
        };
      }
    }

    const teamMembers = await this.em.find(TeamMember, { memberId: member.id });

    const { accessToken, refreshToken } = this.signTokenPair({
      sub: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        avatarUrl: member.avatarUrl,
        role: member.role,
        status: member.status,
        timezone: member.timezone,
        teamIds: teamMembers.map((t) => t.teamId),
      },
      workspace: userWorkspace,
      isNewUser: !userWorkspace,
    };
  }

  async loginWithGoogle(dto: GoogleAuthDto): Promise<GoogleAuthResponseDto> {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new UnauthorizedException('Google login is not configured');
    }

    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(googleClientId);
    }

    let email = '';
    let name = '';
    let picture = '';

    // 1. Verify Google Token (handles both ID token JWT and OAuth2 access token)
    try {
      if (dto.idToken.includes('.') && dto.idToken.split('.').length === 3) {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: dto.idToken,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw new UnauthorizedException('Invalid Google ID token payload');
        }
        email = payload.email.toLowerCase();
        name = payload.name || payload.email.split('@')[0];
        picture =
          payload.picture || `https://api.dicebear.com/9.x/glass/svg?seed=${email}`;
      } else {
        // OAuth2 access token (e.g. from useGoogleLogin implicit flow: ya29...)
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(dto.idToken)}`,
        );
        if (!tokenInfoRes.ok) {
          throw new UnauthorizedException('Invalid or expired Google Token');
        }
        const tokenInfo = (await tokenInfoRes.json()) as {
          aud?: string;
          azp?: string;
          email?: string;
        };
        if (tokenInfo.aud !== googleClientId && tokenInfo.azp !== googleClientId) {
          this.logger.warn(
            `Google token client ID mismatch: token aud/azp (${tokenInfo.aud}/${tokenInfo.azp}) vs expected (${googleClientId})`,
          );
        }
        if (!tokenInfo.email) {
          throw new UnauthorizedException('Invalid Google token: missing email');
        }
        email = tokenInfo.email.toLowerCase();

        try {
          const userInfoRes = await fetch(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
              headers: { Authorization: `Bearer ${dto.idToken}` },
            },
          );
          if (userInfoRes.ok) {
            const userInfo = (await userInfoRes.json()) as {
              name?: string;
              picture?: string;
            };
            name = userInfo.name || email.split('@')[0];
            picture =
              userInfo.picture || `https://api.dicebear.com/9.x/glass/svg?seed=${email}`;
          } else {
            name = email.split('@')[0];
            picture = `https://api.dicebear.com/9.x/glass/svg?seed=${email}`;
          }
        } catch {
          name = email.split('@')[0];
          picture = `https://api.dicebear.com/9.x/glass/svg?seed=${email}`;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google token verification failed';
      this.logger.error(`Google token verification failed: ${msg}`);
      throw new UnauthorizedException(msg || 'Invalid or expired Google Token');
    }

    const memberId =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'googleuser';
    let teamIds: string[] = [];
    let role = 'Member';
    let status = 'online';
    const timezone = 'UTC';
    let userWorkspace: WorkspaceResponseDto | undefined;
    let isNewUser = false;
    let member: Member | null = null;

    // 2. Safely sync with Database
    try {
      member = await this.em.findOne(Member, { email });

      if (!member) {
        isNewUser = true;
        this.logger.log(
          `Creating new member in DB for Google user: ${email} without auto-provisioning`,
        );
        member = new Member({
          id: memberId,
          name,
          email,
          avatarUrl: picture,
          role: 'Admin',
          status: 'online',
          timezone: 'UTC',
          joinedDate: new Date(),
        });
        this.em.persist(member);
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

        // Check user's primary workspace
        const membership = await this.em.findOne(WorkspaceMember, {
          memberId: member.id,
        });
        if (membership) {
          const ws = await this.em.findOne(Workspace, { id: membership.workspaceId });
          if (ws) {
            userWorkspace = {
              id: ws.id,
              name: ws.name,
              slug: ws.slug,
              icon: ws.icon,
              description: ws.description,
              role: membership.role,
              inviteCode: ws.inviteCode,
            };
            isNewUser = false;
          }
        } else {
          // Existing member without any workspace -> needs onboarding
          isNewUser = true;
        }

        const teamMembers = await this.em.find(TeamMember, { memberId: member.id });
        if (teamMembers.length > 0) {
          teamIds = teamMembers.map((t) => t.teamId);
        }
      }
    } catch (dbErr) {
      this.logger.warn(`Database sync skipped (DB error): ${(dbErr as Error).message}`);
    }

    const effectiveMemberId = member ? member.id : memberId;

    // 3. Generate JWT Tokens
    const { accessToken, refreshToken } = this.signTokenPair({
      sub: effectiveMemberId,
      email,
      name,
      role,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: effectiveMemberId,
        name,
        email,
        avatarUrl: picture,
        role,
        status,
        timezone,
        teamIds,
      },
      workspace: userWorkspace,
      isNewUser,
    };
  }
}
