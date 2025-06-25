import Head from "next/head";
import Link from "next/link";
import { getSession } from "next-auth/react";
import prisma from "../../lib/prisma";
import { useState, useRef, useEffect, useMemo } from "react";

const AdminProjectsPage = ({ initialProjects }) => {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const debounceRef = useRef();
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input using useEffect for cleaner logic
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const filteredProjects = useMemo(() => {
    const lower = debouncedSearch.toLowerCase();
    return projects.filter((p) =>
      p.title.toLowerCase().includes(lower) ||
      p.student?.name?.toLowerCase().includes(lower) ||
      p.supervisor?.name?.toLowerCase().includes(lower) ||
      (p.publishedAt && new Date(p.publishedAt).getFullYear().toString().includes(lower))
    );
  }, [projects, debouncedSearch]);

  const handleDeleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete project.");
      setProjects(projects => projects.filter(p => p.id !== projectId));
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>Admin: Manage Projects</title>
      </Head>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-sky-800 mb-6">Manage Projects</h1>
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, student, supervisor, or year..."
            className="w-full md:w-96 px-4 py-2 border border-sky-300 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition placeholder-gray-400 text-gray-800"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No projects found.</td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{project.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{project.student?.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{project.supervisor?.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{project.status}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{project.publishedAt ? new Date(project.publishedAt).getFullYear() : "-"}</td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <Link href={`/repository/${project.id}`} className="text-sky-700 hover:underline">View</Link>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "ADMIN") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  const projects = await prisma.project.findMany({
    include: {
      student: { select: { name: true } },
      supervisor: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return {
    props: {
      initialProjects: JSON.parse(JSON.stringify(projects)),
    },
  };
}

export default AdminProjectsPage;
