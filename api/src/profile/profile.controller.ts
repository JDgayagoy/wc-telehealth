import {
    Body, Controller, Get, Patch, Post, Req, UseGuards,
    UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

mkdirSync(join(process.cwd(), 'uploads', 'profiles'),   { recursive: true });
mkdirSync(join(process.cwd(), 'uploads', 'signatures'),  { recursive: true });
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const profileStorage = diskStorage({
    destination: join(process.cwd(), 'uploads', 'profiles'),
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
    },
});

const signatureStorage = diskStorage({
    destination: join(process.cwd(), 'uploads', 'signatures'),
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
    },
});

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(private profileService: ProfileService) { }

    @Post()
    create(@Req() req, @Body() dto: CreateProfileDto) {
        return this.profileService.create(req.user.id, dto);
    }

    @Get()
    get(@Req() req) {
        return this.profileService.getByUserId(req.user.id);
    }

    @Patch()
    update(@Req() req, @Body() dto: UpdateProfileDto) {
        return this.profileService.update(req.user.id, dto);
    }

    @Post('upload-picture')
    @UseInterceptors(FileInterceptor('file', {
        storage: profileStorage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            if (file.mimetype.startsWith('image/')) cb(null, true);
            else cb(new BadRequestException('Only image files allowed'), false);
        },
    }))
    async uploadPicture(@Req() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        const profilePictureUrl = `/uploads/profiles/${file.filename}`;
        return this.profileService.update(req.user.id, { profilePictureUrl });
    }

    @Get('doctor')
    getDoctorProfile(@Req() req) {
        return this.profileService.getDoctorProfile(req.user.id);
    }

    @Patch('doctor')
    updateDoctorProfile(@Req() req, @Body() dto: UpdateDoctorProfileDto) {
        return this.profileService.updateDoctorProfile(req.user.id, dto);
    }

    @Post('doctor/upload-signature')
    @UseInterceptors(FileInterceptor('file', {
        storage: signatureStorage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            if (file.mimetype.startsWith('image/')) cb(null, true);
            else cb(new BadRequestException('Only image files allowed'), false);
        },
    }))
    async uploadSignature(@Req() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        const signatureUrl = `/uploads/signatures/${file.filename}`;
        return this.profileService.updateDoctorProfile(req.user.id, { signatureUrl });
    }
}
