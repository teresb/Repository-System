import { getSession } from 'next-auth/react';
import Head from 'next/head';
import prisma from '../lib/prisma';
import Link from 'next/link';
import { useState, useMemo, useRef, useEffect } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

const DashboardPage = ({ projects, searchTerm }) => {
    const [search, setSearch] = useState(searchTerm || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm || '');
    const [showFilters, setShowFilters] = useState(false);
    const [filterYear, setFilterYear] = useState('');
    const [filterReportType, setFilterReportType] = useState('');
    const [filterSupervisor, setFilterSupervisor] = useState('');
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

    // Filtered projects with filters
    const filteredProjects = useMemo(() => {
        let filtered = projects;
        const lower = debouncedSearch.toLowerCase();
        if (debouncedSearch) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(lower) ||
                p.student.name.toLowerCase().includes(lower) ||
                p.supervisor.name.toLowerCase().includes(lower) ||
                (p.publishedAt && new Date(p.publishedAt).getFullYear().toString().includes(lower))
            );
        }
        if (filterYear) {
            filtered = filtered.filter(p => p.publishedAt && new Date(p.publishedAt).getFullYear().toString() === filterYear);
        }
        if (filterReportType) {
            filtered = filtered.filter(p => p.reportType === filterReportType);
        }
        if (filterSupervisor) {
            filtered = filtered.filter(p => p.supervisor.name.toLowerCase().includes(filterSupervisor.toLowerCase()));
        }
        return filtered;
    }, [debouncedSearch, projects, filterYear, filterReportType, filterSupervisor]);

    // Unique years and report types for filter dropdowns
    const years = useMemo(() => Array.from(new Set(projects.map(p => p.publishedAt && new Date(p.publishedAt).getFullYear()).filter(Boolean))).sort((a, b) => b - a), [projects]);
    const reportTypes = useMemo(() => Array.from(new Set(projects.map(p => p.reportType).filter(Boolean))), [projects]);
    const supervisors = useMemo(() => Array.from(new Set(projects.map(p => p.supervisor.name).filter(Boolean))), [projects]);

    return (
        <>
            <Head><title>Home & Repository</title></Head>
            <div className="space-y-6">
                {/* Full-width header */}
                <div className="w-full h-80 bg-white shadow-sm rounded-lg px-6 py-5 mb-4 flex flex-col items-center justify-center gap-4">
                    <div className="flex flex-col items-center justify-center h-full w-full gap-5">
                        <h1 className="text-4xl w-180 font-bold text-gray-800 text-center">
                            {search ? `Search Results for "${search}"` : 'Explore a World of Knowledge – Search Projects Across All Specialties'}
                        </h1>
                        <p className="text-gray-600 mt-1 text-center">
                            {search ? `Found ${filteredProjects.length} published projects.` : "Use keywords, project titles, student name, or specialty to quickly find the academic work you're looking for in the repository"}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-center -mt-12 md:flex-row md:justify-center md:items-center ">
                    <div className="relative w-full md:w-[60rem]">
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search by title, student, supervisor, or year..."
                            className="w-full pl-12 pr-4 py-4 text-lg rounded-lg border border-sky-300 bg-white shadow focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition placeholder-gray-400 text-gray-800"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-sky-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className="flex items-center px-4 py-3 rounded-lg border border-sky-300 bg-white shadow hover:bg-sky-50 text-sky-700 font-semibold text-lg focus:outline-none"
                        >
                            <FunnelIcon className="h-6 w-6 mr-2" />
                            Filters
                        </button>
                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200 p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                    <select
                                        value={filterYear}
                                        onChange={e => setFilterYear(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    >
                                        <option value="">All</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                                    <select
                                        value={filterReportType}
                                        onChange={e => setFilterReportType(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    >
                                        <option value="">All</option>
                                        {reportTypes.map(rt => (
                                            <option key={rt} value={rt}>{rt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                                    <select
                                        value={filterSupervisor}
                                        onChange={e => setFilterSupervisor(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    >
                                        <option value="">All</option>
                                        {supervisors.map(sv => (
                                            <option key={sv} value={sv}>{sv}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        setFilterYear('');
                                        setFilterReportType('');
                                        setFilterSupervisor('');
                                    }}
                                    className="w-full mt-2 py-2 rounded bg-sky-100 text-sky-700 font-semibold hover:bg-sky-200"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(project => (
                            <Link key={project.id} href={`/repository/${project.id}`} className="group block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-sky-300 transition-all h-full">
                                <h3 className="text-2xl font-semibold text-sky-700 group-hover:text-sky-800 truncate mb-2">{project.title}</h3>
                                {/* Abstract (if exists) */}
                                {project.abstract && (
                                    <p className="text-xl text-gray-600 mb-4 line-clamp-3">{project.abstract}</p>
                                )}
                                <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs text-gray-500">{project.reportType}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">Uploaded: {new Date(project.publishedAt).toLocaleDateString()}</span>
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