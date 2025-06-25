import Head from "next/head";
import Link from "next/link";
import { getSession } from "next-auth/react";
import prisma from "../../lib/prisma";

const SupervisorSupervisedList = ({ projects }) => {
  return (
    <>
      <Head>
        <title>Supervised Projects</title>
      </Head>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-sky-800 mb-6">Projects You Have Supervised</h1>
        {projects.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            You have not approved any projects yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-sky-700 mb-2 break-words">{project.title}</h2>
                  <p className="text-gray-600 mb-1">Student: <span className="font-medium">{project.student.name}</span></p>
                  <p className="text-gray-500 text-sm mb-2">Approved: {new Date(project.publishedAt).toLocaleDateString()}</p>
                </div>
                <Link
                  href={`/repository/${project.id}`}
                  className="mt-4 inline-block px-4 py-2 bg-sky-700 text-white rounded-md font-semibold hover:bg-sky-800 transition"
                >
                  View Project
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
      status: "PUBLISHED",
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

export default SupervisorSupervisedList;
