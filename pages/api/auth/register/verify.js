import prisma from '../../../../lib/prisma';

import { z } from 'zod';

const verifySchema = z.object({
  matricule: z.string().min(2),
  otp: z.string().length(6)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { matricule, otp } = verifySchema.parse(req.body);
    const pending = await prisma.pendingRegistration.findUnique({ where: { matricule } });
    if (!pending || pending.otp !== otp || pending.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    // Get classlist entry for email
    const classlistEntry = await prisma.classlist.findUnique({ where: { matricule } });
    if (!classlistEntry) {
      return res.status(403).json({ message: 'Matricule not found.' });
    }
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { matricule } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    // Create user
    await prisma.user.create({
      data: {
        name: pending.name,
        password: pending.password,
        role: 'STUDENT',
        matricule
      }
    });
    // Delete pending registration
    await prisma.pendingRegistration.delete({ where: { matricule } });
    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to verify registration.', error: error.message });
  }
}
