import Head from 'next/head';

const HomePage = () => {
  return (
    <>
      <Head>
        <title>Project Repository - Home</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to the Project Repository
        </h1>
        <p className="text-lg text-gray-600">
          Your central hub for academic project reports. Please login or register to continue.
        </p>
      </div>
    </>
  );
};

export default HomePage;
