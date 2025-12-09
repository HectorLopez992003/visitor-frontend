import React, { useState } from "react";

const AdminLogin = ({ goToAdmin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Example credentials (you can change or secure later)
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Admin Login</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Login
      </button>
    </div>
  );
};

export default AdminLogin;
