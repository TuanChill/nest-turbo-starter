import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoogleAuthDto, GoogleAuthResponseDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign in / Sign up with Google OAuth ID Token' })
  @ApiResponse({ status: 200, type: GoogleAuthResponseDto })
  @Post('google')
  loginWithGoogle(@Body() dto: GoogleAuthDto): Promise<GoogleAuthResponseDto> {
    return this.authService.loginWithGoogle(dto);
  }
}
