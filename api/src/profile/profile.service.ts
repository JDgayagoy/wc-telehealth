import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

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
      data: {
        ...dto,
        ...(dto.birthday && { birthday: new Date(dto.birthday) }),
      },
    });
  }

  getDoctorProfile(userId: string) {
    return this.prisma.doctorProfile.findUnique({
      where: { userId },
    });
  }

  updateDoctorProfile(userId: string, dto: UpdateDoctorProfileDto) {
    const defined = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    return this.prisma.doctorProfile.upsert({
      where: { userId },
      update: defined,
      create: {
        userId,
        specialization: [],
        bio: '',
        licenseNumber: '',
        yearsOfExperience: 0,
        ...defined,
      },
    });
  }
}