import { getToken } from "next-auth/jwt";
import prisma from "../../../../lib/prisma";
import { sendProjectStatusUpdateEmail } from "../../../../lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Use getToken for authentication
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "SUPERVISOR") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { projectId } = req.query;
  const { comments } = req.body;

  if (!comments || !comments.trim()) {
    return res
      .status(400)
      .json({ message: "Comments are required for rejection." });
  }

  try {
    // Use a transaction to ensure both actions succeed or fail together
    const [updatedProject, newComment] = await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: { status: "REJECTED" },
        include: { student: true },
      }),
      prisma.comment.create({
        data: {
          content: comments,
          projectId: projectId,
          authorId: token.id,
        },
      }),
    ]);

    // Notify student
    await sendProjectStatusUpdateEmail(
      updatedProject.student.email,
      updatedProject.student.name,
      updatedProject.title,
      "REJECTED",
      comments
    );

    res.status(200).json({ message: "Draft rejected and feedback sent." });
  } catch (error) {
    console.error("Reject error:", error);
    res.status(500).json({ message: "Failed to reject draft." });
  }
}
