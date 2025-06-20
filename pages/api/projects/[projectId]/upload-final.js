import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';

export const config = {
    api: { bodyParser: false },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const token = await getToken({ req });
    if (!token || token.role !== 'STUDENT') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.query;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.studentId !== token.id || project.status !== 'APPROVED_FOR_FINAL') {
        return res.status(403).json({ message: 'You are not authorized to perform this action on this project.' });
    }

    if (!project.finalPdfUrlUrl) {
        return res.status(400).json({ message: 'No approved draft found to publish as final.' });
    }

    try {
        await prisma.project.update({
            where: { id: projectId },
            data: {
                finalPdfUrl: project.finalPdfUrlUrl,
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });
        res.status(200).json({ message: 'Final report published successfully.' });
    } catch (error) {
        console.error('Final publish error:', error);
        res.status(500).json({ message: 'Failed to publish final report.' });
    }
}