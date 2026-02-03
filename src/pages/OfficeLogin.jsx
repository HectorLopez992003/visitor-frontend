import React, { useState } from "react";

const OfficeLogin = ({ onLogin, goBack }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/login/office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const user = await res.json(); // { username, role: "admin" | "staff" }

      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-center">Office Login</h1>
        {error && <p className="text-red-600 text-center">{error}</p>}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-3 rounded-lg"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-3 rounded-lg"
          />
          <button
            type="submit"
            className="bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition"
          >
            Login
          </button>
        </form>
        <button
          onClick={goBack}
          className="text-gray-500 text-center mt-2 hover:underline"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default OfficeLogin;
