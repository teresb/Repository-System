import { getSession } from "next-auth/react";
import prisma from "../../../../lib/prisma";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { entryId } = req.query;

  if (req.method === "DELETE") {
    try {
      await prisma.classlist.delete({
        where: { id: entryId },
      });
      return res.status(204).end(); // No content
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Failed to delete entry from classlist." });
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
