import React, { useState } from "react";

const AdminLogin = ({ goToAdmin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Example credentials (can be secured later)
  const adminUsername = "admin";
  const adminPassword = "admin123";

  const handleLogin = () => {
    if (username === adminUsername && password === adminPassword) {
      goToAdmin();
    } else {
      alert("Incorrect username or password.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 gap-8">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Admin Login</h1>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
          />
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-lg font-bold transition-transform transform hover:scale-105"
          >
            Login
          </button>
        </div>

        <p className="text-gray-500 text-center mt-4 text-sm">
          Enter your admin credentials to access the dashboard.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
