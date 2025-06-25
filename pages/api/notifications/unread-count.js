import { getSession } from 'next-auth/react';
 import prisma from '../../../lib/prisma';

 export default async function handler(req, res) {
     const session = await getSession({ req });
     if (!session) return res.status(401).json({ count: 0 });

     const count = await prisma.notification.count({
         where: { recipientId: session.user.id, isRead: false },
     });

     res.status(200).json({ count });
 }