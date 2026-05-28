import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
    constructor(private doctorsService: DoctorsService) { }

    @Get()
    findAll(@Query('specialization') specialization?: string) {
        return this.doctorsService.findAll(specialization);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.doctorsService.findOne(id);
    }

    @Get(':id/slots')
    getSlots(@Param('id') id: string) {
        return this.doctorsService.getSlots(id);
    }
}