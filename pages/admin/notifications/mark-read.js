import { getSession } from 'next-auth/react';
 import prisma from '../../../lib/prisma';

 export default async function handler(req, res) {
     const session = await getSession({ req });
     if (!session) return res.status(401).end();

     await prisma.notification.updateMany({
         where: { recipientId: session.user.id, isRead: false },
         data: { isRead: true },
     });

     res.status(204).end();
 }