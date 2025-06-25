// File: pages/my-projects.jsx

import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import prisma from "../lib/prisma";

const MyProjectsPage = ({ projects }) => {
  // Helper functions can be moved to a separate utils file later
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING_REVIEW":
        return "bg-yellow-200 text-gray-800";
      case "REJECTED":
        return "bg-red-200 text-red-800";
      case "APPROVED_FOR_FINAL":
        return "bg-green-200 text-green-800";
      case "PUBLISHED":
        return "bg-blue-200 text-blue-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <>
      <Head>
        <title>My Projects</title>
      </Head>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flow-root">
          {projects.length > 0 ? (
            <ul role="list" className="divide-y divide-gray-200">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="py-4 px-2 hover:bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {project.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Last updated:{" "}
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status.replace(/_/g, " ")}
                      </span>
                      {project.status === "APPROVED_FOR_FINAL" && (
                        <Link
                          href={`/projects/${project.id}/upload-final`}
                          className="text-sm font-medium text-green-600 hover:text-green-800"
                        >
                          Upload Final
                        </Link>
                      )}
                      {project.status === "REJECTED" && (
                        <Link
                          href={`/projects/${project.id}/resubmit`}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Resubmit
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-10">
              You have not started any projects yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "STUDENT") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

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
