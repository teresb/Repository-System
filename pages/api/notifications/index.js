import { getToken } from "next-auth/jwt";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  if (req.method === "GET") {
    try {
      const notifications = await prisma.notification.findMany({
        where: { recipientId: token.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return res.status(200).json({ notifications });
    } catch (error) {
      return res.status(500).json({ message: "Failed to load notifications." });
    }
  } else {
    return res.status(405).end();
  }
}
