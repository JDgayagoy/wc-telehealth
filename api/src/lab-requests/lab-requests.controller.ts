import {
    Controller, Post, Get, Patch, Delete, Body, Param, Req,
    UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { LabRequestsService } from './lab-requests.service';
import { CreateLabRequestDto } from './dto/create-lab-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const labResultStorage = diskStorage({
    destination: join(process.cwd(), 'uploads', 'lab-results'),
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
    },
});

@Controller('lab-requests')
@UseGuards(JwtAuthGuard)
export class LabRequestsController {
    constructor(private service: LabRequestsService) {}

    @Post()
    create(@Req() req, @Body() dto: CreateLabRequestDto) {
        return this.service.create(req.user.id, dto);
    }

    @Get('appointment/:appointmentId')
    getByAppointment(@Param('appointmentId') appointmentId: string, @Req() req) {
        return this.service.getByAppointment(appointmentId, req.user.id);
    }

    @Post(':id/upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: labResultStorage,
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (allowed.includes(file.mimetype)) cb(null, true);
            else cb(new BadRequestException('Only PDF and image files allowed'), false);
        },
    }))
    uploadResult(
        @Param('id') id: string,
        @Req() req,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.service.uploadResult(id, req.user.id, file);
    }

    @Patch(':id/reviewed')
    markReviewed(@Param('id') id: string, @Req() req) {
        return this.service.markReviewed(id, req.user.id);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Req() req) {
        return this.service.delete(id, req.user.id);
    }
}
