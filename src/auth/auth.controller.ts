import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { SupabaseGuard } from '../supabase';
import { CurrentUser } from '../common/decorators';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('logout')
    @UseGuards(SupabaseGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser() user: any) {
        return this.authService.logout(user.accessToken);
    }

    @Get('me')
    @UseGuards(SupabaseGuard)
    async getCurrentUser(@CurrentUser() user: any) {
        return this.authService.getCurrentUser(user.sub);
    }
}
