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
        <h1 className="text-3xl font-bold text-sky-800 mb-6">Projects Needing Your Review</h1>
        {projects.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No projects are currently awaiting your review.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-sky-700 mb-2 break-words">{project.title}</h2>
                  <p className="text-gray-600 mb-1">Student: <span className="font-medium">{project.student.name}</span></p>
                  <p className="text-gray-500 text-sm mb-2">Submitted: {new Date(project.publishedAt).toLocaleDateString()}</p>
                </div>
                <Link
                  href={`/projects/${project.id}/review`}
                  className="mt-4 inline-block px-4 py-2 bg-sky-700 text-white rounded-md font-semibold hover:bg-sky-800 transition"
                >
                  Review Project
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "SUPERVISOR") {
    return { redirect: { destination: "/dashboard", permanent: false } };
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
