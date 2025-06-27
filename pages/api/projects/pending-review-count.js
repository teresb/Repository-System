import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session || session.user.role !== "SUPERVISOR") {
    return res.status(401).json({ count: 0 });
  }

  const count = await prisma.project.count({
    where: {
      status: "PENDING_REVIEW",
      supervisorId: session.user.id,
    },
  });

  return res.status(200).json({ count });
}
