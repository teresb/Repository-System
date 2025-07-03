import Head from "next/head";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";
import { useState, useEffect } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

const ProjectReviewPage = ({ project, error, cloudinaryName, cloudinaryApiKey }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", content: "" });
  const [comments, setComments] = useState("");

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  const handleAction = async (action) => {
    let confirmationMessage = "";
    if (action === "approve") {
      confirmationMessage = "Approve this draft for final submission?";
    } else if (action === "reject") {
      if (!comments.trim()) {
        setActionMessage({
          type: "error",
          content: "Comments are required to reject a draft.",
        });
        return;
      }
      confirmationMessage = "Reject this draft?";
    }

    if (!window.confirm(confirmationMessage)) return;

    setIsLoading(true);
    setActionMessage({ type: "", content: "" });

    try {
      const response = await fetch(`/api/projects/${project.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setActionMessage({ type: "success", content: result.message });
      setTimeout(() => router.push("/review"), 2000);
    } catch (err) {
      setActionMessage({ type: "error", content: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Review Project: {project.title}</title>
      </Head>
      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
        {/* PDF Viewer */}
        <div className="flex-grow md:w-2/3">
          <div className="bg-gray-200 rounded-lg shadow-lg h-[85vh] w-full">
            <iframe
              src="/Guidelines for Final year  Project.pdf"
              title={`PDF Preview for ${project.title}`}
              className="w-full h-full border-0 rounded-lg"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <a
              href="/Guidelines for Final year  Project.pdf"
              download
              className="inline-flex items-center px-6 py-3 border-2 border-sky-700 text-lg font-bold rounded-xl shadow text-white bg-sky-700 hover:bg-sky-800 hover:border-sky-800 transition"
            >
              Download PDF
            </a>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:w-1/3 flex-shrink-0">
          <div className="bg-white p-5 rounded-lg shadow-lg space-y-4 sticky top-4">
            <h1 className="text-xl font-bold text-sky-800 break-words">
              {project.title}
            </h1>
            <p className="text-sm text-gray-600">
              Student: <strong>{project.student.name}</strong>
            </p>

            {actionMessage.content && (
              <div
                className={`p-3 rounded-md text-sm ${
                  actionMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {actionMessage.content}
              </div>
            )}

            {project.status === "PENDING_REVIEW" ? (
              <>
                <div className="pt-4 border-t">
                  <label
                    htmlFor="comments"
                    className="block text-sm font-semibold text-gray-800 mb-1"
                  >
                    Feedback / Comments
                  </label>
                  <textarea
                    id="comments"
                    rows="8"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Provide feedback here. Required for rejection."
                  ></textarea>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" /> Approve Draft
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={isLoading || !comments.trim()}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" /> Reject Draft
                  </button>
                </div>
              </>
            ) : (
              <p className="pt-4 border-t text-md font-semibold text-gray-700">
                This project is not currently awaiting review.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const { projectId } = context.params;

  if (!session || session.user.role !== "SUPERVISOR") {
    return { redirect: { destination: "/review", permanent: false } };
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      supervisorId: session.user.id,
    },
    include: {
      student: { select: { name: true, matricule: true } },
    },
  });

  if (!project) {
    return {
      props: {
        error: "Project not found or you are not assigned as its supervisor.",
      },
    };
  }

  return {
    props: {
      project: JSON.parse(JSON.stringify(project)),
    },
  };
}

export default ProjectReviewPage;
