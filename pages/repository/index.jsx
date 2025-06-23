import { getSession } from 'next-auth/react';
import Head from 'next/head';
import prisma from '../../lib/prisma';
import { useState, useMemo } from 'react';
import Link from 'next/link';

const RepositoryPage = ({ projects, filterData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [supervisorFilter, setSupervisorFilter] = useState('');

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const searchLower = searchTerm.toLowerCase();
            const titleMatch = project.title.toLowerCase().includes(searchLower);
            const studentMatch = project.student.name.toLowerCase().includes(searchLower);
            const yearMatch = !yearFilter || project.publishedAt?.startsWith(yearFilter);
            const supervisorMatch = !supervisorFilter || project.supervisorId === supervisorFilter;

            return (titleMatch || studentMatch) && yearMatch && supervisorMatch;
        });
    }, [searchTerm, yearFilter, supervisorFilter, projects]);

    return (
        <>
            <Head><title>Project Repository</title></Head>
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Project Repository</h1>
                    <p className="mt-2 text-md text-gray-600">Browse and search for published final year projects.</p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-20 z-40">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Search by title or student name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:col-span-1 p-2 border border-gray-300 rounded-md"
                        />
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                        >
                            <option value="">All Years</option>
                            {filterData.years.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <select
                            value={supervisorFilter}
                            onChange={(e) => setSupervisorFilter(e.target.value)}
                             className="w-full p-2 border border-gray-300 rounded-md bg-white"
                        >
                            <option value="">All Supervisors</option>
                            {filterData.supervisors.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(project => (
                            <Link key={project.id} href={`/repository/${project.id}`} className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                                <h3 className="text-lg font-bold text-sky-700 truncate">{project.title}</h3>
                                <p className="text-sm text-gray-600 mt-2">by {project.student.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Supervisor: {project.supervisor.name}</p>
                                <p className="text-xs text-gray-400 mt-4">Published: {new Date(project.publishedAt).getFullYear()}</p>
                            </Link>
                        ))
                    ) : (
                        <p className="text-gray-500 md:col-span-3 text-center">No projects found matching your criteria.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export async function getServerSideProps(context) {
    const session = await getSession(context);
    if (!session) {
        return { redirect: { destination: '/auth/login?error=Please log in to view the repository.', permanent: false } };
    }

    const projects = await prisma.project.findMany({
        where: { status: 'PUBLISHED' },
        include: {
            student: { select: { name: true } },
            supervisor: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
    });

    const supervisors = await prisma.user.findMany({
        where: { role: 'SUPERVISOR' },
        select: { id: true, name: true }
    });

    const years = [...new Set(projects.map(p => new Date(p.publishedAt).getFullYear().toString()))];

    return {
        props: {
            projects: JSON.parse(JSON.stringify(projects)),
            filterData: { supervisors, years },
        },
    };
}

export default RepositoryPage;