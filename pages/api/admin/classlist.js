import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    try {
      const { studentName, studentEmail, matricule } = req.body;

      const existing = await prisma.classlist.findFirst({
        where: { studentEmail },
      });
      if (existing) {
        return res
          .status(409)
          .json({
            message:
              "A student with this email already exists on the classlist.",
          });
      }

      const newEntry = await prisma.classlist.create({
        data: { studentName, studentEmail, matricule },
      });
      return res.status(201).json(newEntry);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Failed to add student to classlist." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
