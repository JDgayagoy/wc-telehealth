import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function generateSlots(doctorId: string) {
    const slots: {
        doctorId: string;
        startTime: Date;
        endTime: Date;
        isAvailable: boolean;
    }[] = [];

    const today = startOfDay(new Date());

    for (let day = 1; day <= 30; day++) {
        const date = addDays(today, day);
        const dayOfWeek = date.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const hours = [9, 9.5, 10, 10.5, 11, 11.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5];

        for (const hour of hours) {
            const h = Math.floor(hour);
            const m = hour % 1 === 0.5 ? 30 : 0;

            const startTime = setMinutes(setHours(date, h), m);
            const endTime = setMinutes(setHours(date, m === 30 ? h + 1 : h), m === 30 ? 0 : 30);

            slots.push({ doctorId, startTime, endTime, isAvailable: true });
        }
    }

    await prisma.consultationSlot.createMany({ data: slots });
    console.log(`✅ Created ${slots.length} slots for doctor ${doctorId}`);
}

async function generatePatientData() {
    const patients = await prisma.user.findMany({
        where: { role: 'PATIENT' },
    });

    const doctors = await prisma.user.findMany({
        where: { role: 'DOCTOR' },
    });

    if (patients.length === 0 || doctors.length === 0) {
        console.log('⏭️  Skipping patient data seeding: need at least 1 patient and 1 doctor');
        return;
    }

    const doctorId = doctors[0].id;

    for (const patient of patients) {
        const patientId = patient.id;

        // Medical History
        const historyCount = await prisma.medicalHistory.count({ where: { userId: patientId } });
        if (historyCount === 0) {
            await prisma.medicalHistory.create({
                data: {
                    userId: patientId,
                    condition: 'Hypertension',
                    description: 'Diagnosed with high blood pressure during routine checkup.',
                    isActive: true,
                    diagnosedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
                }
            });
        }

        // Medical Record
        const recordCount = await prisma.medicalRecord.count({ where: { patientId } });
        if (recordCount === 0) {
            await prisma.medicalRecord.create({
                data: {
                    patientId,
                    doctorId,
                    diagnosis: 'Essential Hypertension',
                    treatment: 'Prescribed Amlodipine 5mg. Advised low sodium diet.',
                    consultationNotes: 'Patient reports occasional headaches. BP 140/90.',
                }
            });
        }

        // Prescription
        const prescriptionCount = await prisma.prescription.count({ where: { patientId } });
        if (prescriptionCount === 0) {
            await prisma.prescription.create({
                data: {
                    patientId,
                    doctorId,
                    medication: 'Amlodipine',
                    dosage: '5mg',
                    instructions: 'Take 1 tablet daily in the morning after meals.',
                }
            });
        }
        
        console.log(`✅ Seeded history, records, and prescriptions for patient ${patientId}`);
    }
}

async function main() {
    const doctors = await prisma.user.findMany({
        where: { role: 'DOCTOR' },
        select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
        },
    });

    if (doctors.length === 0) {
        console.log('❌ No doctors found in DB.');
        return;
    }

    console.log(`Found ${doctors.length} doctor(s). Generating slots...`);

    for (const doctor of doctors) {
        const existing = await prisma.consultationSlot.count({
            where: { doctorId: doctor.id },
        });

        if (existing > 0) {
            console.log(`⏭️  Skipping Dr. ${doctor.profile?.firstName} — already has ${existing} slots`);
            continue;
        }

        await generateSlots(doctor.id);
        console.log(`👨‍⚕️  Dr. ${doctor.profile?.firstName} ${doctor.profile?.lastName} — done`);
    }

    console.log('Generating patient data...');
    await generatePatientData();

    console.log('🎉 Seeding complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());