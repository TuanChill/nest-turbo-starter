import { Public } from '@app/common';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AuthResponseDto,
  GoogleAuthDto,
  GoogleAuthResponseDto,
  LoginDto,
  SignUpDto,
} from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register new user account and auto-provision workspace' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @Public()
  @Post('sign-up')
  signUp(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(dto);
  }

  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Sign in / Sign up with Google OAuth ID Token' })
  @ApiResponse({ status: 200, type: GoogleAuthResponseDto })
  @Public()
  @Post('google')
  loginWithGoogle(@Body() dto: GoogleAuthDto): Promise<GoogleAuthResponseDto> {
    return this.authService.loginWithGoogle(dto);
  }
}
