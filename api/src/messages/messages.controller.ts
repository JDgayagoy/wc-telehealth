import {
    Controller, Post, Get, Patch, Body, Param, Req, Query,
    UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const msgStorage = diskStorage({
    destination: join(process.cwd(), 'uploads', 'messages'),
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
    },
});

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private service: MessagesService) {}

    @Get('threads')
    getThreads(@Req() req, @Query('archived') archived?: string) {
        return this.service.getThreads(req.user.id, archived === 'true');
    }

    @Get('appointment/:appointmentId')
    getMessages(@Param('appointmentId') appointmentId: string, @Req() req) {
        return this.service.getMessages(appointmentId, req.user.id);
    }

    @Post()
    send(@Req() req, @Body() dto: SendMessageDto) {
        return this.service.sendText(req.user.id, dto.appointmentId, dto.content ?? '');
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: msgStorage,
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (allowed.includes(file.mimetype)) cb(null, true);
            else cb(new BadRequestException('Only PDF and image files allowed'), false);
        },
    }))
    sendFile(
        @Req() req,
        @Body('appointmentId') appointmentId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('No file uploaded');
        if (!appointmentId) throw new BadRequestException('appointmentId required');
        return this.service.sendFile(req.user.id, appointmentId, file);
    }

    @Patch('appointment/:appointmentId/read')
    markRead(@Param('appointmentId') appointmentId: string, @Req() req) {
        return this.service.markRead(appointmentId, req.user.id);
    }

    @Patch('appointment/:appointmentId/close')
    closeThread(@Param('appointmentId') appointmentId: string, @Req() req) {
        return this.service.closeThread(appointmentId, req.user.id);
    }
}
