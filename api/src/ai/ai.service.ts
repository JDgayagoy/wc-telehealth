import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SPECIALIZATIONS = [
  'General Practitioner', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Psychiatrist', 'Orthopedist', 'Pulmonologist', 'Gastroenterologist',
  'Endocrinologist', 'Pediatrician', 'OB-GYN', 'Urologist', 'Ophthalmologist',
  'ENT Specialist', 'Oncologist',
];

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async recommend(symptoms: string) {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `A patient describes these symptoms: "${symptoms}"
          
From this list of medical specializations, pick the TOP 3 most relevant ones:
${SPECIALIZATIONS.join(', ')}

Respond ONLY with a JSON array of 3 strings, no explanation. Example: ["Cardiologist", "General Practitioner", "Pulmonologist"]`,
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const recommendedSpecs: string[] = JSON.parse(raw.trim());

    const doctors = await this.prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        doctorProfile: {
          specialization: { in: recommendedSpecs },
        },
      },
      select: {
        id: true,
        profile: { select: { firstName: true, lastName: true, profilePictureUrl: true } },
        doctorProfile: { select: { specialization: true, bio: true, yearsOfExperience: true } },
        consultationSlots: {
          where: { isAvailable: true, startTime: { gte: new Date() } },
          take: 3,
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return { recommendedSpecializations: recommendedSpecs, doctors };
  }
}
