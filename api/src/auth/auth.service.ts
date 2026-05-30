import {
    BadRequestException,
    Injectable,
    UnauthorizedException
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/dto";
import { PrismaService } from "src/prisma/prisma.service";
import { SchedulesService } from "../schedules/schedules.service";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private schedulesService: SchedulesService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email);

        if (existing) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            email: dto.email,
            password: hashedPassword,
            role: dto.role,
        });

        await this.prisma.profile.create({
            data: {
                userId: user.id,
                firstName: dto.firstName,
                lastName: dto.lastName,
                contactNumber: dto.contactNumber,
                birthday: dto.birthday
            }
        })

        if (dto.role === 'DOCTOR') {
            await this.prisma.doctorProfile.create({
                data: {
                    userId: user.id,
                    specialization: dto.specialization || [],
                    bio: dto.bio || '',
                    yearsOfExperience: dto.yearsOfExperience || 0,
                    licenseNumber: dto.licenseNumber || '',
                }
            });

            // Auto-generate weekday slots for the next 30 days
            await this.schedulesService.generateDefaultSlots(user.id);
        }

        return {
            message: 'User created',
            user,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new BadRequestException('User not found')
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            throw new BadRequestException('Invalid Password');
        }

        const access_token = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
        })

        return { access_token, user };
    }
}