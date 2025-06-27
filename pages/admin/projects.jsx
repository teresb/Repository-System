import Head from "next/head";
import Link from "next/link";
import { getSession } from "next-auth/react";
import prisma from "../../lib/prisma";
import { useState, useRef, useEffect, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout";

const AdminProjectsPage = ({ initialProjects }) => {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const debounceRef = useRef();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({ title: '', status: '', supervisor: '', year: '' });

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

  const handleEditClick = (project) => {
    setEditingProjectId(project.id);
    setEditProjectForm({
      title: project.title,
      status: project.status,
      supervisor: project.supervisor?.name || '',
      year: project.publishedAt ? new Date(project.publishedAt).getFullYear().toString() : ''
    });
  };

  const handleEditProjectChange = (field, value) => {
    setEditProjectForm(f => ({ ...f, [field]: value }));
  };

  const handleSaveProject = async (projectId) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProjectForm),
      });
      if (!response.ok) throw new Error('Failed to update project.');
      const updated = await response.json();
      setProjects(projects => projects.map(p => p.id === projectId ? { ...p, ...updated } : p));
      setEditingProjectId(null);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
  };

  return (
    <AdminLayout>
      <Head>
        <title>Admin: Manage Projects</title>
      </Head>
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8 sm:p-12 border border-sky-100">
        <div className="flex flex-col items-center justify-center bg-sky-100 py-8 -mx-12 -mt-12 mb-10 rounded-t-2xl shadow-xl">
          <h1 className="text-3xl font-extrabold text-sky-700 mb-1 tracking-tight">Admin: Manage Projects</h1>
          <p className="text-xs sm:text-sm px-6 text-center text-sky-700 font-medium">View, search, or remove projects. Use the search to filter by title, student, supervisor, or year.</p>
        </div>
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, student, supervisor, or year..."
            className="w-full md:w-96 px-4 py-2 border border-sky-200 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition placeholder-sky-400 text-gray-800 bg-sky-50"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-sky-100 bg-sky-50">
          <table className="min-w-full divide-y divide-sky-100">
            <thead className="bg-sky-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-sky-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sky-400">No projects found.</td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 text-sm text-sky-900">
                      {editingProjectId === project.id ? (
                        <input
                          type="text"
                          value={editProjectForm.title}
                          onChange={e => handleEditProjectChange('title', e.target.value)}
                          className="border border-sky-200 rounded-lg px-2 py-1 text-sm bg-white text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      ) : (
                        project.title
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-sky-700">
                      {editingProjectId === project.id ? (
                        <input
                          type="text"
                          value={editProjectForm.student || project.student?.name || ''} // not editable
                          disabled
                          className="border border-sky-100 rounded-lg px-2 py-1 text-sm bg-gray-100 text-sky-700"
                        />
                      ) : (
                        project.student?.name || "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-sky-700">
                      {editingProjectId === project.id ? (
                        <input
                          type="text"
                          value={editProjectForm.supervisor}
                          onChange={e => handleEditProjectChange('supervisor', e.target.value)}
                          className="border border-sky-200 rounded-lg px-2 py-1 text-sm bg-white text-sky-700"
                        />
                      ) : (
                        project.supervisor?.name || "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-sky-700">
                      {editingProjectId === project.id ? (
                        <input
                          type="text"
                          value={editProjectForm.status}
                          onChange={e => handleEditProjectChange('status', e.target.value)}
                          className="border border-sky-200 rounded-lg px-2 py-1 text-sm bg-white text-sky-700"
                        />
                      ) : (
                        project.status
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-sky-700">
                      {editingProjectId === project.id ? (
                        <input
                          type="text"
                          value={editProjectForm.year}
                          onChange={e => handleEditProjectChange('year', e.target.value)}
                          className="border border-sky-200 rounded-lg px-2 py-1 text-sm bg-white text-sky-700"
                        />
                      ) : (
                        project.publishedAt ? new Date(project.publishedAt).getFullYear() : "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      {editingProjectId === project.id ? (
                        <>
                          <button
                            onClick={() => handleSaveProject(project.id)}
                            className="px-3 py-1 bg-sky-700 text-white rounded-lg shadow hover:bg-sky-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 bg-gray-200 text-sky-800 rounded-lg shadow hover:bg-gray-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-200 transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(project)}
                            className="text-sky-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-900 ml-2"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "ADMIN") {
    return { redirect: { destination: "/", permanent: false } };
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
