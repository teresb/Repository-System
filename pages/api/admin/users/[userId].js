import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
    const session = await getSession({ req });
    if (!session || session.user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId } = req.query;

    if (req.method === 'PUT') {
        // Update user role
        try {
            const { role } = req.body;
            if (!['STUDENT', 'SUPERVISOR', 'ADMIN'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role specified.' });
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { role },
            });
            return res.status(200).json(updatedUser);
        } catch (error) {
             return res.status(500).json({ message: 'Failed to update user role.' });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}