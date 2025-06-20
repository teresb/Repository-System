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

  const form = formidable({});
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ message: "Form parsing error" });
    }
    const { title, abstract, supervisorId } = fields;
    const projectFile = files.projectFile?.[0] || files.projectFile;
    if (!title || !abstract || !supervisorId || !projectFile) {
      return res
        .status(400)
        .json({ message: "All fields and a PDF file are required." });
    }
    if (projectFile.mimetype !== "application/pdf") {
      return res
        .status(400)
        .json({ message: "Only PDF files are accepted." });
    }
    try {
      const uploadResult = await cloudinary.uploader.upload(
        projectFile.filepath,
        {
          folder: "project_files",
          resource_type: "auto",
        }
      );
      const project = await prisma.project.create({
        data: {
          title: title.toString(),
          abstract: abstract.toString(),
          status: "PENDING_REVIEW",
          student: { connect: { id: token.id } },
          supervisor: { connect: { id: supervisorId.toString() } },
          finalPdfUrl: uploadResult.secure_url,
        },
      });

      // Send email to supervisor
      const supervisor = await prisma.user.findUnique({
        where: { id: supervisorId.toString() },
      });
      await sendProjectSubmissionEmail(
        supervisor.email,
        token.name || "A student",
        title.toString(),
        project.id
      );

      res
        .status(201)
        .json({ message: "Project created successfully", projectId: project.id });
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });
}
