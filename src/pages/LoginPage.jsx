import React from "react";

const LoginPage = ({ goToGuard, goToOffice, goToAdminLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-3xl font-bold">Login Page</h1>
      <div className="flex gap-4">
        <button
          onClick={goToGuard}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guard Site
        </button>
        <button
          onClick={goToOffice}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Office Site
        </button>
        <button
          onClick={goToAdminLogin}
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Admin Login
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
