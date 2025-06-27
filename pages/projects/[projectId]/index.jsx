import Head from "next/head";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";
import Link from "next/link";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

const ProjectDetailPage = ({ project, error }) => {
  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{project.title}</title>
      </Head>
      <div className="max-w-5xl mx-auto mt-10">
        <div className="bg-white p-12 rounded-2xl shadow-2xl space-y-10 border-2 border-sky-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b-2 border-sky-100 pb-6">
            <div>
              <Link
                href="/"
                className="text-lg text-sky-700 hover:underline font-semibold flex items-center gap-2"
              >
                &larr; Back
              </Link>
              <h1 className="text-4xl font-extrabold text-sky-800 mt-3 mb-2 drop-shadow">
                {project.title}
              </h1>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-lg text-sky-700 font-medium mt-2">
                <span>
                  Author:{" "}
                  <span className="text-gray-800 font-semibold">
                    {project.student.name}
                  </span>
                </span>
                <span>
                  Supervisor:{" "}
                  <span className="text-gray-800 font-semibold">
                    {project.supervisor.name}
                  </span>
                </span>
                <span>
                  Report Type:{" "}
                  <span className="text-gray-800 font-semibold">
                    {project.reportType}
                  </span>
                </span>
                <span>
                  Published:{" "}
                  <span className="text-gray-800 font-semibold">
                    {new Date(project.publishedAt).toLocaleDateString()}
                  </span>
                </span>
              </div>
            </div>
            <a
              href={`/api/projects/${project.id}/track?action=download`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border-2 border-sky-700 text-lg font-bold rounded-xl shadow text-white bg-sky-700 hover:bg-sky-800 hover:border-sky-800 transition"
            >
              <ArrowDownTrayIcon className="-ml-1 mr-2 h-6 w-6" />
              Download PDF
            </a>
          </div>
          <div className="pt-6">
            <h2 className="text-2xl font-bold text-sky-800 mb-3">Abstract</h2>
            <p className="text-lg text-gray-700 whitespace-pre-wrap bg-sky-50 rounded-lg p-6 border border-sky-100">
              {project.abstract}
            </p>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="mt-10">
          <div className="bg-sky-50 rounded-2xl shadow-lg border-2 border-sky-100 h-[80vh] w-full overflow-hidden">
            {project.finalPdfUrl ? (
              <iframe
                src={project.finalPdfUrl}
                title={`PDF Viewer for ${project.title}`}
                className="w-full h-full border-0 rounded-2xl"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sky-700 text-xl font-semibold">
                Final PDF is not available for this project.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/auth/login?error=Please log in to view projects.",
        permanent: false,
      },
    };
  }

  const { projectId } = context.params;

  try {
    await prisma.project.updateMany({
      where: {
        id: projectId,
        status: "APPROVED", // Only count views for approved projects
      },
      data: {
        viewCount: { increment: 1 },
      },
    });
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        student: { select: { name: true } },
        supervisor: { select: { name: true } },
      },
    });

    if (!project || project.status !== "APPROVED") {
      return {
        props: { error: "Project not found or has not been approved." },
      };
    }

    return { props: { project: JSON.parse(JSON.stringify(project)) } };
  } catch (e) {
    return { props: { error: "Failed to load project details." } };
  }
}

export default ProjectDetailPage;
