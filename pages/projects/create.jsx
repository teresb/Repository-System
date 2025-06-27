import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSession } from "next-auth/react";
import prisma from "../../lib/prisma";

const newProjectSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters long."),
  abstract: z.string().min(20, "Description must be at least 20 characters long."),
  supervisorId: z.string().cuid("You must select a supervisor."),
  projectFile: z
    .any()
    .refine((files) => files?.length === 1, "A PDF file is required.")
    .refine((files) => files?.[0]?.type === "application/pdf", "Only .pdf files are accepted."),
});

const NewProjectPage = ({ supervisors }) => {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(newProjectSchema),
    defaultValues: { supervisorId: "" },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError("");
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("abstract", data.abstract);
    formData.append("supervisorId", data.supervisorId);
    formData.append("projectFile", data.projectFile[0]);
    // Get type from query string
    const type = router.query.type;
    if (type) {
      formData.append("type", type);
    }
    try {
      const response = await fetch(`/api/projects/create${type ? `?type=${type}` : ""}`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "An error occurred");
      router.push("/");
    } catch (error) {
      setServerError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Start New Project</title>
      </Head>
      <div className="flex items-center justify-center ">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-8 sm:p-12 border border-sky-100">
          

          {serverError && (
            <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg text-sm mb-4 text-center">{serverError}</p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <p className="block text-2xl text-center font-semibold text-sky-800 mb-1">Enter your project details</p>
              <label htmlFor="title" className="block text-sm font-semibold text-sky-800 mb-1">Project Title</label>
              <input
                id="title"
                type="text"
                {...register("title")}
                className="mt-1 block w-full px-4 py-2 border border-sky-200 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 bg-sky-50 placeholder-sky-300 transition"
                placeholder="Enter your project title"
                autoComplete="off"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="abstract" className="block text-sm font-semibold text-sky-800 mb-1">Abstract</label>
              <textarea
                id="abstract"
                rows={4}
                {...register("abstract")}
                className="mt-1 block w-full px-4 py-2 border border-sky-200 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 bg-sky-50 placeholder-sky-300 transition"
                placeholder="Briefly describe your project"
              />
              {errors.abstract && <p className="text-red-500 text-xs mt-1">{errors.abstract.message}</p>}
            </div>
            <div>
              <label htmlFor="supervisorId" className="block text-sm font-semibold text-sky-800 mb-1">Select Supervisor</label>
              <select
                id="supervisorId"
                {...register("supervisorId")}
                className="mt-1 block w-full px-4 py-2 border border-sky-200 bg-sky-50 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 transition"
              >
                <option value="" disabled>-- Select a supervisor --</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>
                ))}
              </select>
              {errors.supervisorId && <p className="text-red-500 text-xs mt-1">{errors.supervisorId.message}</p>}
            </div>
            <div>
              <label htmlFor="projectFile" className="block text-sm font-semibold text-sky-800 mb-1">Project PDF File (.pdf only)</label>
              <input
                id="projectFile"
                type="file"
                {...register("projectFile")}
                accept=".pdf,application/pdf"
                className="mt-1 block w-full text-sm text-sky-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
              {errors.projectFile && <p className="text-red-500 text-xs mt-1">{errors.projectFile.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 rounded-lg text-base font-bold text-white bg-gradient-to-r from-sky-700 to-sky-600 shadow hover:from-sky-800 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-sky-300 transition mt-2"
            >
              {isLoading ? "Submitting..." : "Create Project and Submit for Review"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || session.user.role !== "STUDENT") {
    return { redirect: { destination: "/", permanent: false } };
  }

  // Fetch the list of supervisors to populate the dropdown
  const supervisors = await prisma.user.findMany({
    where: { role: "SUPERVISOR" },
    select: { id: true, name: true },
  });

  return { props: { supervisors } };
}

export default NewProjectPage;
