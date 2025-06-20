import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import prisma from "../lib/prisma";
import { UserGroupIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

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
  console.log("Dashboard session:", session);

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="space-y-8">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">
            Welcome, {session.user.name}!
          </h1>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-sky-100 text-sky-800">
              Role: {session.user.role}
            </span>
          </div>
        </div>

        {/* Student's Project Section */}
        {session.user.role === "STUDENT" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="sm:flex sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                My Projects
              </h2>
              <Link
                href="/projects/new"
                className="mt-3 sm:mt-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
              >
                Start New Project
              </Link>
            </div>

            <div className="mt-6 flow-root">
              {projects.length > 0 ? (
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {projects.map((project) => (
                    <li key={project.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {project.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Last updated: {formatDate(project.updatedAt)}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {project.status.replace("_", " ")}
                          </span>
                          {/* Show upload link only if project is REJECTED */}
                          {project.status === "REJECTED" && (
                            <Link
                              href={`/projects/${project.id}/resubmit`}
                              className="ml-4 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Re-upload Draft
                            </Link>
                          )}
                          {/* --- NEW: Conditional Button for Final Upload --- */}
                          {project.status === "APPROVED_FOR_FINAL" && (
                            <Link
                              href={`/projects/${project.id}/upload-final`}
                              className="inline-flex items-center px-3 py-1 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                            >
                              Upload Final
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 mt-4">
                  You have not started any projects yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Supervisor and Admin sections will be added here later */}
        {session.user.role === "SUPERVISOR" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">
              Projects Awaiting Your Review
            </h2>
            <div className="mt-6 flow-root">
              {projects.length > 0 ? (
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {projects.map((project) => (
                    <li key={project.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {project.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Student: {project.student.name}
                          </p>
                        </div>
                        <Link
                          href={`/projects/${project.id}/review`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Review
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 mt-4">
                  There are no projects currently awaiting your review.
                </p>
              )}
            </div>
          </div>
        )}
        {session.user.role === "ADMIN" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">
              Admin Control Panel
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Use the tools below to manage the system's users and registration
              access.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Link
                href="/admin/users"
                className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
              >
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-sky-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Manage Users
                    </dt>
                    <dd className="text-xs text-gray-500">
                      View, edit roles, and manage all registered users.
                    </dd>
                  </dl>
                </div>
              </Link>
              <Link
                href="/admin/classlist"
                className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
              >
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-sky-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Manage Classlist
                    </dt>
                    <dd className="text-xs text-gray-500">
                      Control which students are permitted to register.
                    </dd>
                  </dl>
                </div>
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
