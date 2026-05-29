import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHistoryDto } from './dto/create-patient.dto';

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
}
