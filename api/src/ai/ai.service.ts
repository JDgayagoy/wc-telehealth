import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SPECIALIZATIONS = [
  'General Practitioner', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Psychiatrist', 'Orthopedist', 'Pulmonologist', 'Gastroenterologist',
  'Endocrinologist', 'Pediatrician', 'OB-GYN', 'Urologist', 'Ophthalmologist',
  'ENT Specialist', 'Oncologist',
];

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) { }

  async recommend(symptoms: string) {
    let recommendedSpecs: string[] = [];
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
      const model = genAI.getGenerativeModel({ model: '	gemini-2.5-pro' });
      const result = await model.generateContent(
        `A patient describes these symptoms: "${symptoms}"

From this list of medical specializations, pick the TOP 3 most relevant ones:
${SPECIALIZATIONS.join(', ')}

Respond ONLY with a JSON array of 3 strings, no explanation. Example: ["Cardiologist", "General Practitioner", "Pulmonologist"]`
      );
      const raw = result.response.text().trim();
      const match = raw.match(/\[.*\]/s);
      recommendedSpecs = match ? JSON.parse(match[0]) : [];
    } catch (e) {
      console.error('AI Recommendation failed, falling back to empty recommendation:', e);
      recommendedSpecs = [];
    }

    const doctors = await this.prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        doctorProfile: {
          specialization: { hasSome: recommendedSpecs },
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
