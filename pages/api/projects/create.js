import { getToken } from "next-auth/jwt";
import prisma from "../../../lib/prisma";
import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";
import { sendProjectSubmissionEmail } from "../../../lib/email";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "STUDENT") {
    return res
      .status(401)
      .json({ message: "Unauthorized. You must be logged in as a student." });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ message: "Form parsing error" });
    }

    const { title, abstract, supervisorId } = fields;
    const projectType = req.query.type || fields.type; // get type from query or fields
    const projectFile = files.projectFile?.[0] || files.projectFile;

    if (!title || !abstract || !supervisorId || !projectFile) {
      return res
        .status(400)
        .json({ message: "All fields and a PDF file are required." });
    }

    if (projectFile.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF files are accepted." });
    }

    try {
      // Upload PDF file with token-based (private) access
      const uploadResult = await cloudinary.uploader.upload(
        projectFile.filepath,
        {
          folder: "project_files",
          resource_type: "raw",
          type: "authenticated", // ✅ token-based secure access
        }
      );

      // Save Cloudinary public_id for generating secure links later
      const project = await prisma.project.create({
        data: {
          title: title.toString(),
          abstract: abstract.toString(),
          status: "PENDING_REVIEW",
          student: { connect: { id: token.id } },
          supervisor: { connect: { id: supervisorId.toString() } },
          finalPdfUrl: uploadResult.public_id, // Save public_id, not the full URL
          reportType: projectType ? projectType.toString().toUpperCase() : undefined, // Set reportType
        },
      });

      // Notify supervisor
      const projectWithRelations = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          supervisor: { select: { id: true } },
          student: { select: { name: true } },
        },
      });

      await prisma.notification.create({
        data: {
          recipientId: projectWithRelations.supervisor.id,
          message: `Student ${projectWithRelations.student.name} has submitted a draft for the project "${projectWithRelations.title}".`,
          link: `/projects/${projectWithRelations.id}/review`,
        },
      });

      // Email the supervisor
      const supervisor = await prisma.user.findUnique({
        where: { id: supervisorId.toString() },
      });

      await sendProjectSubmissionEmail(
        supervisor.email,
        token.name || "A student",
        title.toString(),
        project.id
      );

      return res.status(201).json({
        message: "Project created successfully",
        projectId: project.id,
      });
    } catch (error) {
      console.error("Project creation error:", error);
      return res.status(500).json({ message: "Failed to create project" });
    }
  });
}
