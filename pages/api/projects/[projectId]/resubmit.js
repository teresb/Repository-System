import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { sendProjectSubmissionEmail } from '../../../../lib/email';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
    api: { bodyParser: false },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const session = await getSession({ req });
    if (!session || session.user.role !== 'STUDENT') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.query;

    const projectCheck = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectCheck || projectCheck.studentId !== session.user.id || projectCheck.status !== 'REJECTED') {
        return res.status(403).json({ message: 'This project is not awaiting resubmission.' });
    }

    const form = formidable({});
    try {
        const [fields, files] = await form.parse(req);
        const correctedFile = files.correctedFile?.[0];

        if (!correctedFile) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const uploadResult = await cloudinary.uploader.upload(correctedFile.filepath, {
            folder: 'project_drafts', // Can re-use the same folder
            resource_type: 'auto',
        });
        fs.unlinkSync(correctedFile.filepath);

        // Update project: new draft URL and reset status to PENDING_REVIEW
        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                draftPdfUrl: uploadResult.secure_url,
                status: 'PENDING_REVIEW', // Put it back in the supervisor's queue
            },
            include: {
                supervisor: true,
                student: true,
            }
        });

        // Re-notify the supervisor
        if (project.supervisor?.email) {
            await sendProjectSubmissionEmail(
                project.supervisor.email,
                project.student.name,
                project.title,
                project.id
            );
        }

        res.status(200).json({ message: 'Corrected draft uploaded successfully.' });

    } catch (error) {
        console.error("Resubmission error:", error);
        res.status(500).json({ message: 'Failed to resubmit draft.' });
    }
}