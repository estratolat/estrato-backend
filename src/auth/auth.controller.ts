import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login con email/password' })
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      return this.authService.login(user);
    } catch (error: any) {
      console.error('[LOGIN FAILED]', loginDto.email, error?.message || error);
      throw error;
    }
  }

  @Post('brigada/login')
  @ApiOperation({ summary: 'Login exclusivo para brigadas con teléfono + PIN' })
  async loginBrigada(@Body() loginDto: { telefono: string; pin: string }) {
    try {
      const user = await this.authService.validateBrigadaUser(loginDto.telefono, loginDto.pin);
      return this.authService.login(user);
    } catch (error: any) {
      console.error('[LOGIN BRIGADA FAILED]', loginDto.telefono, error?.message || error);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario actual' })
  async getMe(@Req() req) {
    return this.authService.getMe(req.user.userId);
  }
}
