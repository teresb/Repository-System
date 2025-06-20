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
  abstract: z.string().min(20, "Abstract must be at least 20 characters long."),
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
    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "An error occurred");
      router.push("/dashboard");
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
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Start a New Project
        </h1>
        {serverError && (
          <p className="text-red-500 bg-red-100 p-3 rounded-md text-sm mb-4">
            {serverError}
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Project Title
            </label>
            <input
              id="title"
              type="text"
              {...register("title")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="abstract"
              className="block text-sm font-medium text-gray-700"
            >
              Abstract
            </label>
            <textarea
              id="abstract"
              rows={4}
              {...register("abstract")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
            {errors.abstract && (
              <p className="text-red-500 text-xs mt-1">
                {errors.abstract.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="supervisorId"
              className="block text-sm font-medium text-gray-700"
            >
              Select Supervisor
            </label>
            <select
              id="supervisorId"
              {...register("supervisorId")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="" disabled>
                -- Select a supervisor --
              </option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name}
                </option>
              ))}
            </select>
            {errors.supervisorId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.supervisorId.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="projectFile"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project PDF File (.pdf only)
            </label>
            <input
              id="projectFile"
              type="file"
              {...register("projectFile")}
              accept=".pdf,application/pdf"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
            {errors.projectFile && (
              <p className="text-red-500 text-xs mt-1">
                {errors.projectFile.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400"
          >
            {isLoading ? "Submitting..." : "Create Project and Submit for Review"}
          </button>
        </form>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || session.user.role !== "STUDENT") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  // Fetch the list of supervisors to populate the dropdown
  const supervisors = await prisma.user.findMany({
    where: { role: "SUPERVISOR" },
    select: { id: true, name: true },
  });

  return { props: { supervisors } };
}

export default NewProjectPage;
