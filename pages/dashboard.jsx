import { getSession } from 'next-auth/react';
import Head from 'next/head';
import prisma from '../lib/prisma';
import Link from 'next/link';
import { useState, useMemo, useRef } from 'react';

const DashboardPage = ({ projects, searchTerm }) => {
    const [search, setSearch] = useState(searchTerm || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm || '');
    const debounceRef = useRef();

    // Debounce search input
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(value);
        }, 300);
    };

    const filteredProjects = useMemo(() => {
        if (!debouncedSearch) return projects;
        const lower = debouncedSearch.toLowerCase();
        return projects.filter(p =>
            p.title.toLowerCase().includes(lower) ||
            p.student.name.toLowerCase().includes(lower) ||
            p.supervisor.name.toLowerCase().includes(lower) ||
            (p.publishedAt && new Date(p.publishedAt).getFullYear().toString().includes(lower))
        );
    }, [debouncedSearch, projects]);

    return (
        <>
            <Head><title>Home & Repository</title></Head>
            <div className="space-y-6">
                {/* Full-width header */}
                <div className="w-full bg-white shadow-sm rounded-lg px-6 py-5 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {search ? `Search Results for "${search}"` : 'Project Repository'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {search ? `Found ${filteredProjects.length} published projects.` : 'Browse all published projects below or use the search bar.'}
                        </p>
                    </div>
                    <div className="w-full md:w-80">
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Search by title, student, supervisor, or year..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-sky-300 bg-white shadow focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition placeholder-gray-400 text-gray-800"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(project => (
                            <Link key={project.id} href={`/repository/${project.id}`} className="group block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-sky-300 transition-all">
                                <h3 className="text-lg font-semibold text-sky-700 group-hover:text-sky-800 truncate">{project.title}</h3>
                                <p className="text-sm text-gray-600 mt-2">by {project.student.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Supervisor: {project.supervisor.name}</p>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Published: {new Date(project.publishedAt).getFullYear()}</span>
                                    <span className="text-xs text-white bg-sky-600 px-2 py-1 rounded-full group-hover:bg-sky-700">View Project</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                         <div className="md:col-span-3 text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                             <p className="text-gray-600 font-medium">No Projects Found</p>
                             <p className="text-gray-500 text-sm mt-1">Try a different search term or check back later.</p>
                         </div>
                    )}
                </div>
            </div>
        </>
    );
};

export async function getServerSideProps(context) {
    const session = await getSession(context);
    if (!session) {
        return { redirect: { destination: '/auth/login', permanent: false } };
    }

    const { q: searchTerm = '' } = context.query;
    const searchConditions = [];

    if (searchTerm) {
        // Condition for text search in title, student name, or supervisor name
        searchConditions.push({
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { student: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { supervisor: { name: { contains: searchTerm, mode: 'insensitive' } } },
            ],
        });

        // Condition for year search
        const year = parseInt(searchTerm, 10);
        if (!isNaN(year) && searchTerm.length === 4) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year + 1, 0, 1);
            searchConditions[0].OR.push({
                publishedAt: {
                    gte: startDate,
                    lt: endDate,
                },
            });
        }
    }

    const projects = await prisma.project.findMany({
        where: {
            status: 'PUBLISHED',
            AND: searchConditions,
        },
        include: {
            student: { select: { name: true } },
            supervisor: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
    });

    return {
        props: {
            projects: JSON.parse(JSON.stringify(projects)),
            searchTerm,
        },
    };
}

export default DashboardPage;