import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const registerUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const validatedData = registerUserSchema.parse(req.body);
    const { name, email, password } = validatedData;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // 2. Check if student is on the classlist
    const classlistEntry = await prisma.classlist.findUnique({ where: { studentEmail: email } });
    if (!classlistEntry) {
      return res.status(403).json({ message: 'Registration failed. Your email is not on the approved classlist.' });
    }

    // 3. Ensure name matches classlist entry
    if (classlistEntry.studentName.toLowerCase() !== name.toLowerCase()) {
      return res.status(403).json({
        message: 'Registration failed. The name provided does not match the classlist record for this email.',
      });
    }

    // 4. Create the new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    return res.status(201).json({ message: 'Registration successful!', userId: user.id });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.flatten().fieldErrors });
    }
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}
