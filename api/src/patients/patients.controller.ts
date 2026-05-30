import {
    Controller, Get, Post, Patch, Delete, Body, Param, Req,
    UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHistoryDto } from './dto/create-patient.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    // --- Medical History (patient's own) ---
    @Get('history')
    findAll(@Req() req) {
        return this.patientsService.findAll(req.user.id);
    }

    @Post('history')
    create(@Req() req, @Body() dto: CreateHistoryDto) {
        return this.patientsService.create(req.user.id, dto);
    }

    @Patch('history/:id')
    update(@Req() req, @Param('id') id: string, @Body() dto: CreateHistoryDto) {
        return this.patientsService.update(req.user.id, id, dto);
    }

    @Delete('history/:id')
    delete(@Req() req, @Param('id') id: string) {
        return this.patientsService.delete(req.user.id, id);
    }

    // --- File upload + AI extraction ---
    @Post('history/extract')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        fileFilter: (_, file, cb) => {
            const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Only PDF and image files are allowed'), false);
            }
        },
    }))
    async extractFromFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.patientsService.extractFromFile(file);
    }

    // --- Patient-facing: physical stats ---
    @Get('my/stats')
    getMyStats(@Req() req) {
        return this.patientsService.getStats(req.user.id);
    }

    @Patch('my/stats')
    upsertMyStats(@Req() req, @Body() body: { weight: number; height: number }) {
        return this.patientsService.upsertStats(req.user.id, body.weight, body.height);
    }

    // --- Patient-facing: get own medical records ---
    @Get('my/medical-records')
    getMyMedicalRecords(@Req() req) {
        return this.patientsService.getPatientMedicalRecords(req.user.id);
    }

    // --- Patient-facing: get own prescriptions ---
    @Get('my/prescriptions')
    getMyPrescriptions(@Req() req) {
        return this.patientsService.getPatientPrescriptions(req.user.id);
    }

    // --- Doctor-facing: get a specific patient's history ---
    @Get(':patientId/history')
    getPatientHistory(@Param('patientId') patientId: string) {
        return this.patientsService.findAll(patientId);
    }

    // --- Doctor-facing: get a specific patient's prescriptions ---
    @Get(':patientId/prescriptions')
    getPatientPrescriptions(@Param('patientId') patientId: string) {
        return this.patientsService.getPatientPrescriptions(patientId);
    }

    // --- Doctor-facing: get a specific patient's medical records ---
    @Get(':patientId/medical-records')
    getPatientMedicalRecords(@Param('patientId') patientId: string) {
        return this.patientsService.getPatientMedicalRecords(patientId);
    }

    // --- Patient-facing: get appointment summary (diagnosis + prescriptions) ---
    @Get('my/appointments/:appointmentId/summary')
    getAppointmentSummary(@Req() req, @Param('appointmentId') appointmentId: string) {
        return this.patientsService.getAppointmentSummary(req.user.id, appointmentId);
    }

    // --- Doctor-facing: create a new medical record (from appointment context) ---
    @Post('by-appointment/:appointmentId/medical-records')
    createMedicalRecordByAppointment(@Req() req, @Param('appointmentId') appointmentId: string, @Body() dto: CreateMedicalRecordDto) {
        return this.patientsService.createMedicalRecordByAppointment(req.user.id, appointmentId, dto);
    }

    // --- Doctor-facing: create a new medical record ---
    @Post(':patientId/medical-records')
    createMedicalRecord(@Req() req, @Param('patientId') patientId: string, @Body() dto: CreateMedicalRecordDto) {
        return this.patientsService.createMedicalRecord(req.user.id, patientId, dto);
    }
}
