import { Controller, Get, Post, Patch, Delete, Param, Req, UseGuards, Body } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
    constructor(private schedulesService: SchedulesService) { }

    @Post('generate')
    generate(@Req() req) {
        return this.schedulesService.generateDefaultSlots(req.user.id);
    }

    @Get('slots')
    getMySlots(@Req() req) {
        return this.schedulesService.getMySlots(req.user.id);
    }

    @Patch('slots/:id/toggle')
    toggleSlot(@Param('id') id: string, @Req() req) {
        return this.schedulesService.toggleSlotAvailability(id, req.user.id);
    }

    @Post('custom')
    addCustomSchedule(@Req() req, @Body() body: any) {
        return this.schedulesService.addCustomSchedule(req.user.id, body);
    }

    @Delete('slots/:id')
    deleteSlot(@Param('id') id: string, @Req() req) {
        return this.schedulesService.deleteSlot(id, req.user.id);
    }
}
