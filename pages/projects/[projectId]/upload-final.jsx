import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const finalUploadSchema = z.object({
  finalFile: z
    .any()
    .refine(
      (files) => files?.length === 1,
      "Your final PDF report is required."
    )
    .refine(
      (files) => files?.[0]?.type === "application/pdf",
      "Only .pdf files are accepted."
    ),
});

const UploadFinalPage = ({ project, error }) => {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState({ type: "", content: "" });
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(finalUploadSchema),
  });

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  const onSubmit = async () => {
    setIsLoading(true);
    setServerMessage({ type: "", content: "" });
    try {
      const response = await fetch(`/api/projects/${project.id}/upload-final`, {
        method: "POST",
        credentials: "include", // Ensure cookies/session are sent
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useDraft: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "An error occurred");

      setServerMessage({
        type: "success",
        content:
          "Final report published successfully! Your project is now published.",
      });
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error) {
      setServerMessage({ type: "error", content: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Upload Final Report</title>
      </Head>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <p className="text-sm text-green-600 font-semibold">
            Draft Approved!
          </p>
          <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your draft has been approved by your supervisor. Please review your
            approved draft below and upload the final version of your report to
            publish it to the repository.
          </p>
          {/* Show the approved draft PDF for reference */}
          {project.finalPdfUrlUrl && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Approved Draft:
              </h3>
              <iframe
                src={project.finalPdfUrlUrl}
                title="Approved Draft PDF"
                className="w-full h-96 border rounded"
                frameBorder="0"
              />
              <a
                href={project.finalPdfUrlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-sky-600 hover:underline text-sm"
              >
                Download Approved Draft
              </a>
            </div>
          )}
        </div>

        {serverMessage.content && (
          <div
            className={`p-4 mb-6 rounded-md text-sm flex items-center gap-x-3 ${
              serverMessage.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {serverMessage.type === "success" ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5" />
            )}
            {serverMessage.content}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 border-t pt-6"
        >
          <h2 className="text-lg font-semibold text-gray-700">
            Confirm and Publish Your Final PDF Report
          </h2>
          <button
            type="submit"
            disabled={isLoading || serverMessage.type === "success"}
            className="w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400"
          >
            {isLoading ? "Publishing..." : "Publish Final Report (Use Approved Draft)"}
          </button>
        </form>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const { projectId } = context.params;

  if (!session || session.user.role !== "STUDENT") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.studentId !== session.user.id) {
    return {
      props: { error: "Project not found or you don't have permission." },
    };
  }

  if (project.status !== "APPROVED_FOR_FINAL") {
    return {
      props: {
        error: "This project is not currently awaiting final submission.",
      },
    };
  }

  return { props: { project: JSON.parse(JSON.stringify(project)) } };
}

export default UploadFinalPage;
