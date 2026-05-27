import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  create(userId: string, dto: CreateProfileDto) {
    return this.prisma.profile.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthday: new Date(dto.birthday),
        contactNumber: dto.contactNumber,
        profilePictureUrl: dto.profilePictureUrl,
      },
    });
  }

  getByUserId(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
    });
  }

  update(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { userId },
      data: dto,
    });
  }
}