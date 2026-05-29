import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) { }

  @Post()
  create(@Req() req, @Body() dto: CreateProfileDto) {
    return this.profileService.create(req.user.sub, dto);
  }

  @Get()
  get(@Req() req) {
    return this.profileService.getByUserId(req.user.sub);
  }

  @Patch()
  update(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(req.user.sub, dto);
  }
}
