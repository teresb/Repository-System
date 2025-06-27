import prisma from '../../../../lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { randomInt } from 'crypto';
import { sendOtpEmail } from '../../../../lib/email';

const startSchema = z.object({
  name: z.string().min(2),
  matricule: z.string().min(2),
  password: z.string().min(6),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { name, matricule, password } = startSchema.parse(req.body);
    const classlistEntry = await prisma.classlist.findUnique({ where: { matricule } });
    if (!classlistEntry) {
      return res.status(403).json({ message: 'Matricule not found or not authorized.' });
    }
    // Generate OTP
    const otp = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // Hash password for storage
    const hashedPassword = await bcrypt.hash(password, 10);
    // Store in PendingRegistration (create this model in Prisma)
    await prisma.pendingRegistration.upsert({
      where: { matricule },
      update: { otp, expiresAt, name: name, password: hashedPassword },
      create: { matricule, otp, expiresAt, name: name, password: hashedPassword },
    });
    // Send OTP to email
    await sendOtpEmail(classlistEntry.studentEmail, otp);
    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Registration start error:', error);
    res.status(400).json({ message: 'Failed to start registration.', error: error.message });
  }
}
