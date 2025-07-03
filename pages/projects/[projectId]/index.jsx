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
      <div className="max-w-7xl mx-auto mt-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* PDF Viewer */}
          <div className="flex-grow md:w-2/3">
            <div className="bg-sky-50 rounded-2xl shadow-lg border-2 border-sky-100 h-[80vh] w-full overflow-hidden">
              <iframe
                src="/Guidelines for Final year  Project.pdf"
                title={`PDF Viewer for ${project.title}`}
                className="w-full h-full border-0 rounded-2xl"
              />
            </div>
          </div>

          {/* Project Details Sidebar */}
          <div className="md:w-1/3 flex-shrink-0">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-sky-200 space-y-8 sticky top-8">
              <Link
                href="/"
                className="text-lg text-sky-700 hover:underline font-semibold flex items-center gap-2"
              >
                &larr; Back
              </Link>
              <h1 className="text-xl font-bold text-sky-800 mb-2 drop-shadow">
                {project.title}
              </h1>
              <div>
                <p className="text-base text-gray-700 whitespace-pre-wrap bg-sky-50 rounded-lg p-4 border border-sky-100">
                  {project.abstract}
                </p>
              </div>
              <div className="flex flex-col gap-2 text-lg text-sky-700 font-small mt-2">
                <span>
                  Student:{" "}
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
