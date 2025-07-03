// File: pages/my-projects.jsx

import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import prisma from "../lib/prisma";

const PROJECT_TYPES = [
  { key: "INTERNSHIP", label: "Internship Project" },
  { key: "FINAL", label: "Final Report" },
];

const MyProjectsPage = ({ projects }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING_REVIEW":
        return "bg-yellow-200 text-gray-800";
      case "REJECTED":
        return "bg-red-200 text-red-800";
      case "APPROVED":
        return "bg-green-200 text-green-800";
      case "PUBLISHED":
        return "bg-blue-200 text-blue-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Group projects by reportType for easy lookup (show the latest if multiple)
  const projectsByType = {};
  projects.forEach((p) => {
    const key = p.reportType && p.reportType.toUpperCase(); // Ensure uppercase for matching
    if (
      key &&
      (!projectsByType[key] ||
        new Date(p.updatedAt) > new Date(projectsByType[key].updatedAt))
    ) {
      projectsByType[key] = p;
    }
  });

  return (
    <>
      <Head>
        <title>My Projects</title>
      </Head>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-100 text-sky-800 rounded-md font-semibold shadow hover:bg-sky-200 border border-sky-200 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-sky-800">My Projects</h1>
        </div>
        {/* Removed Add Project button */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {PROJECT_TYPES.map((type) => {
          const project = projectsByType[type.key]; // type.key is "INTERNSHIP" or "FINAL"
          return (
            <div
              key={type.key}
              className="bg-white p-8 rounded-lg shadow border border-gray-200 flex flex-col justify-between"
            >
              <h2 className="text-xl font-bold text-sky-700 mb-2">
                {type.label}
              </h2>
              {project ? (
                <>
                  <p className="text-gray-800 font-semibold">
                    {project.title}
                  </p>
                  <div className="flex gap-4">
                    {/* Removed View button */}
                    {project.status === "REJECTED" && (
                      <Link
                        href={`/projects/${project.id}/resubmit`}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Resubmit
                      </Link>
                    )}
                  </div>
                  <div className="flex items-end justify-between mt-8">
                    <p className="text-gray-500 text-sm">
                      Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  
                </>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-gray-500 mb-2">
                    No {type.label.toLowerCase()} started yet.
                  </p>
                  <Link
                    href={`/projects/create?type=${type.key}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 text-white rounded-md font-semibold shadow hover:bg-sky-800 transition border border-sky-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add {type.label}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "STUDENT") {
    return { redirect: { destination: "/my-projects", permanent: false } };
  }

  // Assumes project.type is either "INTERNSHIP" or "FINAL"
  const projects = await prisma.project.findMany({
    where: { studentId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return {
    props: {
      projects: JSON.parse(JSON.stringify(projects)),
    },
  };
}

export default MyProjectsPage;
    
