import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import prisma from "../lib/prisma";
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

// Helper function to format the date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-200 text-gray-800";
    case "PENDING_REVIEW":
      return "bg-yellow-200 text-yellow-800";
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

const DashboardPage = ({ projects }) => {
  const { data: session } = useSession();

  const renderProjectList = (projList) => (
    <div className="mt-8 flow-root">
      {projList.length > 0 ? (
        <ul role="list" className="divide-y divide-gray-200">
          {projList.map((project) => (
            <li
              key={project.id}
              className="py-5 hover:bg-gray-50 px-2 -mx-2 rounded-md transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {project.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {session.user.role === "SUPERVISOR"
                      ? `Student: ${project.student.name}`
                      : `Last updated: ${new Date(
                          project.updatedAt
                        ).toLocaleDateString()}`}
                  </p>
                  {project.status === "PUBLISHED" &&
                    session.user.role === "STUDENT" && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {project.viewCount} views
                        </span>
                        <span className="flex items-center">
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          {project.downloadCount} downloads
                        </span>
                      </div>
                    )}
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status.replace(/_/g, " ")}
                  </span>
                  {session.user.role === "SUPERVISOR" && (
                    <Link
                      href={`/projects/${project.id}/review`}
                      className="text-sm font-medium text-sky-600 hover:text-sky-800"
                    >
                      Review
                    </Link>
                  )}
                  {session.user.role === "STUDENT" &&
                    project.status === "APPROVED_FOR_FINAL" && (
                      <Link
                        href={`/projects/${project.id}/upload-final`}
                        className="text-sm font-medium text-green-600 hover:text-green-800"
                      >
                        Upload Final
                      </Link>
                    )}
                  {session.user.role === "STUDENT" &&
                    project.status === "REJECTED" && (
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
        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">
            {session.user.role === "STUDENT"
              ? "You have not started any projects yet."
              : "There are no projects currently in your queue."}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="space-y-10">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-6 text-gray-900">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back, {session.user.name}!
            </p>
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-sky-100 text-sky-800">
              Role: {session.user.role}
            </span>
          </div>
        </div>

        {/* Student's Project Section */}
        {session.user.role === "STUDENT" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="sm:flex sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                My Projects
              </h2>
              <Link
                href="/projects/new"
                className="mt-3 sm:mt-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 transition-colors"
              >
                Start New Project
              </Link>
            </div>
            {renderProjectList(projects)}
          </div>
        )}

        {/* Supervisor and Admin sections will be added here later */}
        {session.user.role === "SUPERVISOR" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Projects Awaiting Your Review
            </h2>
            {renderProjectList(projects)}
          </div>
        )}
        {session.user.role === "ADMIN" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Admin Control Panel
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Link
                href="/admin/users"
                className="group block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:bg-sky-50 hover:border-sky-300 transition-all"
              >
                <UserGroupIcon className="h-8 w-8 text-sky-600 group-hover:scale-110 transition-transform" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Manage Users
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  View users and change their roles.
                </p>
              </Link>
              <Link
                href="/admin/classlist"
                className="group block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:bg-sky-50 hover:border-sky-300 transition-all"
              >
                <ClipboardDocumentListIcon className="h-8 w-8 text-sky-600 group-hover:scale-110 transition-transform" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Manage Classlist
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Control student registration access.
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }

  let projects = [];
  if (session.user.role === "STUDENT") {
    projects = await prisma.project.findMany({
      where: { studentId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });
  } else if (session.user.role === "SUPERVISOR") {
    projects = await prisma.project.findMany({
      where: {
        supervisorId: session.user.id,
        status: "PENDING_REVIEW", // Only show pending projects
      },
      include: {
        student: { select: { name: true } }, // Include student's name
      },
      orderBy: { updatedAt: "asc" }, // Show oldest first
    });
  }

  // TODO: Fetch projects for supervisor role as well

  return {
    props: {
      session,
      // Safely serialize date objects
      projects: JSON.parse(JSON.stringify(projects)),
    },
  };
}

export default DashboardPage;
