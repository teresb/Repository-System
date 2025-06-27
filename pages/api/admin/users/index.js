import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession({ req });
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { name, matricule, role, password } = req.body;
  if (!name || !matricule || !role || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (!['STUDENT', 'SUPERVISOR', 'ADMIN'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        matricule,
        role,
        password: hashedPassword,
      },
    });
    // Do not return password hash to client
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Matricule already exists.' });
    }
    return res.status(500).json({ message: 'Failed to create user.' });
  }
}
