import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const resubmitSchema = z.object({
  correctedFile: z.any()
    .refine(files => files?.length === 1, "Your corrected PDF report is required.")
    .refine(files => files?.[0]?.type === "application/pdf", "Only .pdf files are accepted."),
});

const ResubmitPage = ({ project, error }) => {
    const router = useRouter();
    const [serverMessage, setServerMessage] = useState({ type: '', content: '' });
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(resubmitSchema),
    });

    if (error) {
        return <div className="text-center text-red-500 p-8">{error}</div>;
    }

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerMessage({ type: '', content: '' });
        const formData = new FormData();
        formData.append('correctedFile', data.correctedFile[0]);

        try {
            const response = await fetch(`/api/projects/${project.id}/resubmit`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'An error occurred');

            setServerMessage({ type: 'success', content: 'Corrected draft uploaded! Your supervisor has been notified.' });
            setTimeout(() => router.push('/'), 2000);

        } catch (error) {
            setServerMessage({ type: 'error', content: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head><title>Resubmit Draft: {project.title}</title></Head>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Project Info and Comments */}
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <p className="text-sm text-red-600 font-semibold">Draft Requires Revisions</p>
                    <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>

                    <div className="mt-6 border-t pt-6">
                        <h2 className="text-lg font-semibold text-gray-700">Supervisor's Feedback</h2>
                        {project.comments.length > 0 ? (
                            <div className="mt-4 space-y-4">
                                {project.comments.map(comment => (
                                     <div key={comment.id} className="p-4 bg-gray-50 border rounded-md">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                                        <p className="text-xs text-gray-500 text-right mt-2">
                                            - {comment.author?.name} on {new Date(comment.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-gray-500">No specific comments were left.</p>
                        )}
                    </div>
                </div>

                {/* Resubmission Form */}
                 <div className="bg-white p-8 rounded-lg shadow-md">
                    {serverMessage.content && (
                        <div className={`p-4 mb-6 rounded-md text-sm flex items-center gap-x-3 ${
                            serverMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {serverMessage.type === 'success' ? <CheckCircleIcon className="h-5 w-5"/> : <ExclamationCircleIcon className="h-5 w-5"/>}
                            {serverMessage.content}
                        </div>
                    )}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                         <h2 className="text-lg font-semibold text-gray-700">Upload Corrected Draft</h2>
                         <div>
                            <label htmlFor="correctedFile" className="block text-sm font-medium text-gray-700 mb-1">Corrected PDF File</label>
                            <input
                                id="correctedFile"
                                type="file"
                                {...register('correctedFile')}
                                accept=".pdf,application/pdf"
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                            />
                            {errors.correctedFile && <p className="text-red-500 text-xs mt-1">{errors.correctedFile.message}</p>}
                        </div>
                        <button type="submit" disabled={isLoading || serverMessage.type === 'success'} className="w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400">
                            {isLoading ? 'Resubmitting...' : 'Resubmit Corrected Draft'}
                        </button>
                    </form>
                 </div>
            </div>
        </>
    );
}

export async function getServerSideProps(context) {
    const session = await getSession(context);
    const { projectId } = context.params;

    if (!session || session.user.role !== 'STUDENT') {
        return { redirect: { destination: '/', permanent: false } };
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            comments: {
                orderBy: { createdAt: 'desc' },
                include: { author: { select: { name: true } } }
            }
        }
    });

    if (!project || project.studentId !== session.user.id) {
        return { props: { error: "Project not found or you don't have permission." } };
    }

    if (project.status !== 'REJECTED') {
        return { props: { error: "This project is not currently awaiting resubmission." } };
    }

    return { props: { project: JSON.parse(JSON.stringify(project)) } };
}

export default ResubmitPage;
