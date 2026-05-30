import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@Req() req) {
        return { id: req.user.id, email: req.user.email, role: req.user.role };
    }
}