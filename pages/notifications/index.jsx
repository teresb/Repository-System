import { getSession } from 'next-auth/react';
 import Head from 'next/head';
 import prisma from '../../lib/prisma';
 import { useRouter } from 'next/router';

 const NotificationsPage = ({ notifications }) => {
     const router = useRouter();

     const markAllAsRead = async () => {
         try {
             await fetch('/api/notifications/mark-all-read', { method: 'POST' });
             router.replace(router.asPath);  // Refresh the page to show updated notifications
         } catch (error) {
             console.error("Failed to mark all as read", error);
         }
     };

     return (
         <>
             <Head><title>Notifications</title></Head>
             <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-6">
                     <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                     <button onClick={markAllAsRead} className="text-sm text-sky-600 hover:underline">Mark all as read</button>
                 </div>
                 <ul className="divide-y divide-gray-200">
                     {notifications.length > 0 ? notifications.map(notif => (
                         <li key={notif.id} className={`p-4 ${!notif.isRead ? 'bg-sky-50' : ''}`}>
                             <Link href={notif.link || '#'} className="block hover:bg-gray-50">
                                 <div className="flex items-center">
                                     {!notif.isRead && <div className="h-2 w-2 bg-sky-500 rounded-full mr-3"></div>}
                                     <p className={`flex-1 text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                         {notif.message}
                                     </p>
                                     <time className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</time>
                                 </div>
                             </Link>
                         </li>
                     )) : (
                         <li className="text-center text-gray-500 p-4">You have no notifications.</li>
                     )}
                 </ul>
             </div>
         </>
     );
 };

 export async function getServerSideProps(context) {
     const session = await getSession(context);
     if (!session) return { redirect: { destination: '/auth/login', permanent: false } };

     const notifications = await prisma.notification.findMany({
         where: { recipientId: session.user.id },
         orderBy: { createdAt: 'desc' },
     });

     return { props: { notifications: JSON.parse(JSON.stringify(notifications)) } };
 }

 export default NotificationsPage;