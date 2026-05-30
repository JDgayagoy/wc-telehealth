import {
    Body, Controller, Get, Patch, Post, Req, UseGuards,
    UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from './cloudinary.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(
        private profileService: ProfileService,
        private cloudinaryService: CloudinaryService,
    ) { }

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
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            if (file.mimetype.startsWith('image/')) cb(null, true);
            else cb(new BadRequestException('Only image files allowed'), false);
        },
    }))
    async uploadPicture(@Req() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        const upload = await this.cloudinaryService.uploadImage(file, 'wc-telehealth/profiles');
        const profilePictureUrl = upload.secure_url;
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
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            if (file.mimetype.startsWith('image/')) cb(null, true);
            else cb(new BadRequestException('Only image files allowed'), false);
        },
    }))
    async uploadSignature(@Req() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        const upload = await this.cloudinaryService.uploadImage(file, 'wc-telehealth/signatures');
        const signatureUrl = upload.secure_url;
        return this.profileService.updateDoctorProfile(req.user.id, { signatureUrl });
    }
}
