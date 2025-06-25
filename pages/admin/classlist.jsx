import { getSession } from "next-auth/react";
import Head from "next/head";
import prisma from "../../lib/prisma";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";

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
    <>
      <Head>
        <title>Admin: Manage Classlist</title>
      </Head>
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Add Student to Classlist
          </h1>
          <form
            onSubmit={handleSubmit(onAddStudent)}
            className="grid grid-cols-1 gap-6 sm:grid-cols-3"
          >
            <div>
              <label htmlFor="studentName">Student Name</label>
              <input
                id="studentName"
                {...register("studentName")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              {errors.studentName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.studentName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="studentEmail">Student Email</label>
              <input
                id="studentEmail"
                {...register("studentEmail")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              {errors.studentEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.studentEmail.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="matricule">Matricule (Optional)</label>
              <input
                id="matricule"
                {...register("matricule")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Current Classlist
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table head and body */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Matricule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classlist.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.studentName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {entry.studentEmail}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
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
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "ADMIN") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  const classlist = await prisma.classlist.findMany({
    orderBy: { studentName: "asc" },
  });

  return { props: { initialClasslist: classlist } };
}

export default AdminClasslistPage;
