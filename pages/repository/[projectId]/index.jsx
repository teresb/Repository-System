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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
          <div>
            <Link
              href="/repository"
              className="text-sm text-sky-600 hover:underline"
            >
              &larr; Back to Repository
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              {project.title}
            </h1>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <a
                href={`/api/projects/${project.id}/track?action=download`}
                target="_blank" // Open in new tab to start download
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
              >
                <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                Download PDF
              </a>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Author:</strong> {project.student.name}
            </p>
            <p>
              <strong>Supervisor:</strong> {project.supervisor.name}
            </p>
            <p>
              <strong>Published:</strong>{" "}
              {new Date(project.publishedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800">Abstract</h2>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
              {project.abstract}
            </p>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="mt-8">
          <div className="bg-gray-200 rounded-lg shadow-lg h-[85vh] w-full">
            {project.finalPdfUrl ? (
              <iframe
                src={project.finalPdfUrl}
                title={`PDF Viewer for ${project.title}`}
                className="w-full h-full border-0 rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600">
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
        status: "PUBLISHED", // Only count views for published projects
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

    if (!project || project.status !== "PUBLISHED") {
      return {
        props: { error: "Project not found or has not been published." },
      };
    }

    // TODO: Increment view count here later.

    return { props: { project: JSON.parse(JSON.stringify(project)) } };
  } catch (e) {
    return { props: { error: "Failed to load project details." } };
  }
}

export default ProjectDetailPage;
