import { getSession } from 'next-auth/react';
import Head from 'next/head';
import prisma from '../lib/prisma';
import Link from 'next/link';
import { useState, useMemo, useRef } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

const HomePage = ({ projects, searchTerm, supervisorNames }) => {
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
            <Head><title>Home</title></Head>
            <div className="space-y-6">
                {/* Full-width header */}
                <div className="w-full h-64 bg-sky-100 shadow rounded-xl px-10 py-8 -mt-12 mb-4 flex flex-col items-center justify-center gap-4 border-b-4 border-sky-700">
                    <div className="flex flex-col items-center justify-center h-full w-full gap-5">
                        <h1 className="text-4xl w-2/3 font-bold text-sky-700 text-center drop-shadow-lg">
                            {search ? `Search Results for "${search}"` : 'Explore a World of Knowledge – Search Projects Across All Specialties'}
                        </h1>
                        <p className="text-sky-700 mt-2 text-sm text-cente">
                            {search ? (
                                <span>Found <span className="text-sm font-bold text-yellow-300 align-middle">{filteredProjects.length}</span> published projects.</span>
                            ) : (
                                "Use keywords, project titles, student name, or specialty to quickly find the academic work you're looking for in the repository"
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-center -mt-12 md:flex-row md:justify-center md:items-center ">
                    <div className="relative w-full md:w-[40rem]">
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search by title, student, supervisor, or year..."
                            className="w-full pl-12 pr-4 py-3 text-md rounded-xl border-2 border-sky-400 bg-white shadow focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-600 transition placeholder-gray-400 text-gray-800"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 text-sky-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <div className="relative ml-4 mt-4 md:mt-0">
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className="flex items-center px-6 py-2 rounded-xl border-2 border-sky-400 bg-white shadow hover:bg-sky-50 text-sky-700 font-bold text-md focus:outline-none"
                        >
                            <FunnelIcon className="h-7 w-7 mr-2" />
                            Filters
                        </button>
                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl z-50 border-2 border-sky-200 p-6 space-y-2">
                                <div>
                                    <label className="block text-base font-semibold text-sky-700 mb-2">Year</label>
                                    <select
                                        value={filterYear}
                                        onChange={e => setFilterYear(e.target.value)}
                                        className="w-full border border-sky-300 rounded-md p-2 text-sm text-gray-400"
                                    >
                                        <option value="">All</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-sky-700 mb-2">Report Type</label>
                                    <select
                                        value={filterReportType}
                                        onChange={e => setFilterReportType(e.target.value)}
                                        className="w-full border border-sky-300 rounded-md p-2 text-sm text-gray-400"
                                    >
                                        <option value="">All</option>
                                        {reportTypes.map(rt => (
                                            <option key={rt} value={rt}>{rt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-sky-700 mb-2">Supervisor</label>
                                    <select
                                        value={filterSupervisor}
                                        onChange={e => setFilterSupervisor(e.target.value)}
                                        className="w-full border border-sky-300 rounded-md p-2 text-sm text-gray-400"
                                    >
                                        <option value="">All</option>
                                        {supervisorNames.map(sv => (
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
                                    className="w-full mt-2 py-2 rounded bg-sky-100 text-sky-700 font-bold hover:bg-sky-200 text-sm"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(project => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="group flex flex-col bg-white p-8 rounded-2xl shadow-lg border-2 border-sky-200 hover:shadow-2xl hover:border-sky-400 transition-all h-full min-h-[280px]"
                                style={{ minHeight: 180, display: 'flex' }}
                            >
                                <h3 className="text-2xl font-bold text-sky-800 group-hover:text-sky-900 truncate mb-3">{project.title}</h3>
                                {/* Abstract (if exists) */}
                                {project.abstract && (
                                    <p className="text-sm text-gray-700 line-clamp-3 mb-2">{project.abstract}</p>
                                )}
                                <div className="flex items-end justify-between pt-2 border-t border-sky-100 mt-2">
                                    <div className="flex flex-col items-start">
                                        <span className="text-base text-sky-700 font-semibold">{project.reportType}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">Uploaded: {new Date(project.publishedAt).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="md:col-span-3 text-center py-20 border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50">
                            <p className="text-sky-700 font-bold text-xl">No Projects Found</p>
                            <p className="text-sky-600 text-lg mt-2">Try a different search term or check back later.</p>
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
        return { redirect: { destination: "/auth/login", permanent: false } };
    }
    if (session.user.role === "ADMIN") {
        return { redirect: { destination: "/admin/users", permanent: false } };
    }

    const { q: searchTerm = '' } = context.query;
    const searchConditions = [];

    if (searchTerm) {
        searchConditions.push({
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { student: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { supervisor: { name: { contains: searchTerm, mode: 'insensitive' } } },
            ],
        });

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
            status: 'APPROVED',
            AND: searchConditions,
        },
        include: {
            student: { select: { name: true } },
            supervisor: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
    });

    // Fetch all supervisors
    const allSupervisors = await prisma.user.findMany({
        where: { role: 'SUPERVISOR' },
        select: { name: true },
        orderBy: { name: 'asc' },
    });
    const supervisorNames = allSupervisors.map(s => s.name);

    return {
        props: {
            projects: JSON.parse(JSON.stringify(projects)),
            searchTerm,
            supervisorNames,
        },
    };
}

export default HomePage;
