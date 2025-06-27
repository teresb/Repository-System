import { getSession } from "next-auth/react";
import Head from "next/head";
import prisma from "../../lib/prisma";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

const classlistSchema = z.object({
  studentName: z.string().min(2, "Name is required"),
  studentEmail: z.string().email("A valid email is required"),
  matricule: z.string().optional(),
});

const AdminClasslistPage = ({ initialClasslist }) => {
  const [classlist, setClasslist] = useState(initialClasslist);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(classlistSchema),
  });

  const onAddStudent = async (data) => {
    try {
      const response = await fetch("/api/admin/classlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to add student.");
      }
      const newStudent = await response.json();
      setClasslist((prev) => [...prev, newStudent]);
      reset();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const onDeleteStudent = async (entryId) => {
    if (
      !confirm(
        "Are you sure you want to remove this student from the classlist?"
      )
    )
      return;
    try {
      const response = await fetch(`/api/admin/classlist/${entryId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete student.");
      setClasslist((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Admin: Manage Classlist</title>
      </Head>
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 sm:p-12 border border-sky-100 space-y-8">
        <div className="flex flex-col items-center justify-center bg-sky-100 py-8 -mx-12 -mt-12 mb-10 rounded-t-2xl shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sky-700 mb-1 tracking-tight">
            Admin: Manage Classlist
          </h1>
          <p className="text-xs sm:text-sm px-6 text-center text-sky-700 font-medium">
            Add or remove students from the classlist. Email and matricule are
            required for each student.
          </p>
        </div>
        <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 shadow-md">
          <form
            onSubmit={handleSubmit(onAddStudent)}
            className="flex flex-col sm:flex-row sm:items-end gap-3"
          >
            <div className="flex-1 min-w-0">
              <label
                htmlFor="studentName"
                className="block text-sky-700 font-semibold mb-1"
              >
                Student Name
              </label>
              <input
                id="studentName"
                {...register("studentName")}
                className="mt-1 block w-full border border-sky-200 rounded-lg shadow-sm p-2 bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-500 text-sm"
              />
              {errors.studentName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.studentName.message}
                </p>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="studentEmail"
                className="block text-sky-700 font-semibold mb-1"
              >
                Student Email
              </label>
              <input
                id="studentEmail"
                {...register("studentEmail")}
                className="mt-1 block w-full border border-sky-200 rounded-lg shadow-sm p-2 bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-500 text-sm"
              />
              {errors.studentEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.studentEmail.message}
                </p>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="matricule"
                className="block text-sky-700 font-semibold mb-1"
              >
                Matricule
              </label>
              <input
                id="matricule"
                {...register("matricule")}
                className="mt-1 block w-full border border-sky-200 rounded-lg shadow-sm p-2 bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-500 text-sm"
              />
            </div>
            <div className="flex-shrink-0 sm:ml-2 mt-2 sm:mt-0">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto rounded-lg border border-sky-100">
          <table className="min-w-full divide-y divide-sky-100">
            <thead className="bg-sky-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-sky-100">
              {classlist.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 text-sm text-sky-900">
                    {entry.studentName}
                  </td>
                  <td className="px-6 py-4 text-sm text-sky-700">
                    {entry.studentEmail}
                  </td>
                  <td className="px-6 py-4 text-sm text-sky-700">
                    {entry.matricule || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => onDeleteStudent(entry.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
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

  const classlist = await prisma.classlist.findMany({
    orderBy: { studentName: "asc" },
  });

  return { props: { initialClasslist: classlist } };
}

export default AdminClasslistPage;
