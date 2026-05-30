import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const records = await prisma.medicalRecord.findMany({
    include: {
      patient: { select: { email: true } },
      doctor: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
    }
  });
  console.log('--- MEDICAL RECORDS ---');
  records.forEach(r => {
    console.log(`ID: ${r.id}, Patient: ${r.patient.email}, Doctor: ${r.doctor.profile?.firstName} ${r.doctor.profile?.lastName}, Diagnosis: ${r.diagnosis}`);
  });

  const history = await prisma.medicalHistory.findMany({
    include: {
      user: { select: { email: true } },
    }
  });
  console.log('--- MEDICAL HISTORY ---');
  history.forEach(h => {
    console.log(`ID: ${h.id}, User: ${h.user.email}, Condition: ${h.condition}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
