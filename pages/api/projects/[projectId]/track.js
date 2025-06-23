import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.query;
    const { action } = req.query; // We'll look for ?action=download

    if (action === 'download') {
        try {
            const project = await prisma.project.update({
                where: { id: projectId },
                data: {
                    downloadCount: { increment: 1 },
                },
            });

            // Redirect the user to the actual file URL to start the download
            res.redirect(307, project.finalPdfUrl);

        } catch (error) {
            console.error("Download tracking error:", error);
            res.status(404).json({ message: 'Project not found.' });
        }
    } else {
        res.status(400).json({ message: 'Invalid action.' });
    }
}