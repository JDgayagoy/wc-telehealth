import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) { }

  @Post(':userId')
  create(
    @Param('userId') userId: string,
    @Body() dto: CreateProfileDto,
  ) {
    return this.profileService.create(userId, dto);
  }

  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.profileService.getByUserId(userId);
  }

  @Patch(':userId')
  update(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.update(userId, dto);
  }
}