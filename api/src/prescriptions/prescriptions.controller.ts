import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionsController {
    constructor(private prescriptionsService: PrescriptionsService) { }

    // Doctor issues a prescription
    @Post()
    create(@Req() req, @Body() dto: CreatePrescriptionDto) {
        return this.prescriptionsService.create(req.user.id, dto);
    }

    // Doctor issues multiple prescriptions
    @Post('batch')
    batchCreate(@Req() req, @Body() dtos: CreatePrescriptionDto[]) {
        return this.prescriptionsService.batchCreate(req.user.id, dtos);
    }

    // Doctor views all prescriptions they issued
    @Get('mine')
    findByDoctor(@Req() req) {
        return this.prescriptionsService.findByDoctor(req.user.id);
    }
}
