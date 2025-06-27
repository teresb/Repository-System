import Head from "next/head";
import Link from "next/link";
import { getSession } from "next-auth/react";
import prisma from "../../lib/prisma";

const SupervisorReviewList = ({ projects }) => {
  return (
    <>
      <Head>
        <title>Projects Needing Review</title>
      </Head>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 text-sky-800 rounded-md font-semibold shadow hover:bg-sky-200 transition border border-sky-200"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
          <h1 className="text-3xl font-bold text-sky-800 text-center md:text-left m-0">
            Projects Needing Your Review
          </h1>
        </div>
        {projects.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow text-center text-gray-400 text-lg border border-sky-100">
            No projects are currently awaiting your review.
          </div>
        ) : (
          <ul className="space-y-4">
            {projects.map((project) => (
              <li
                key={project.id}
                className="bg-white p-6 rounded-xl shadow border border-sky-100 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-lg transition-shadow duration-200"
              >
                <div>
                  <h2 className="text-lg font-semibold text-sky-800 mb-1 break-words">
                    {project.title}
                  </h2>
                  <p className="text-gray-700 mb-1">
                    <span className="font-semibold">Student:</span> {project.student.name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    <span className="font-medium">Submitted:</span> {new Date(project.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 md:ml-8 flex-shrink-0">
                  <Link
                    href={`/projects/${project.id}/review`}
                    className="inline-block px-5 py-2 bg-sky-700 text-white rounded-lg font-bold hover:bg-sky-800 transition text-center shadow"
                  >
                    Review Project
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "SUPERVISOR") {
    return { redirect: { destination: "/", permanent: false } };
  }

  const projects = await prisma.project.findMany({
    where: {
      status: "PENDING_REVIEW",
      supervisorId: session.user.id,
    },
    include: {
      student: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return {
    props: {
      projects: JSON.parse(JSON.stringify(projects)),
    },
  };
}

export default SupervisorReviewList;
