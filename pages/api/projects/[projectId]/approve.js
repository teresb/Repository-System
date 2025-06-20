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
  const { comments } = req.body; // Optional comments on approval

  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "APPROVED_FOR_FINAL",
      },
      include: { student: true },
    });

    // Add the comment to the database, even on approval
    if (comments && comments.trim()) {
      await prisma.comment.create({
        data: {
          content: `[APPROVAL COMMENT]\n${comments}`,
          projectId: projectId,
          authorId: token.id,
        },
      });
    }

    // Notify student
    await sendProjectStatusUpdateEmail(
      project.student.email,
      project.student.name,
      project.title,
      "APPROVED_FOR_FINAL"
    );

    res.status(200).json({ message: "Draft approved successfully!" });
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ message: "Failed to approve draft." });
  }
}
