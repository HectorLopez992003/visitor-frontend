import React from "react";

const LoginPage = ({ goToGuard, goToOffice, goToAdminLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-8 w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center">Welcome Back</h1>
        <p className="text-gray-500 text-center">Select your portal to continue</p>

        <div className="flex flex-col w-full gap-4">
          <button
            onClick={goToGuard}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transform transition"
          >
            Guard Portal
          </button>
          <button
            onClick={goToOffice}
            className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transform transition"
          >
            Office Portal
          </button>
          <button
            onClick={goToAdminLogin}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-3 rounded-xl shadow-lg hover:scale-105 transform transition"
          >
            Admin Login
          </button>
        </div>

        <div className="mt-6 text-gray-400 text-sm text-center">
          &copy; {new Date().getFullYear()} Visitor Management System
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
