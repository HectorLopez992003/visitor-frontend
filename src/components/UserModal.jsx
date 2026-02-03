import React, { useState, useEffect } from "react";

const UserModal = ({ isOpen, onClose, onSave, editingUser }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Guard");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [active, setActive] = useState(true);

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [strength, setStrength] = useState("");

  // 🔐 Password Strength Checker
  const checkStrength = (pass) => {
    if (pass.length < 6) return "Weak";
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && pass.length >= 8)
      return "Strong";
    return "Medium";
  };

  // 🔑 Auto Password Generator
  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
    setConfirmPassword(gen);
    setStrength(checkStrength(gen));
  };

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || "");
      setEmail(editingUser.email || "");
      setRole(editingUser.role || "Guard");
      setActive(editingUser.active ?? true);
      setPassword("");
      setConfirmPassword("");
      setStrength("");
    } else {
      setName("");
      setEmail("");
      setRole("Guard");
      setPassword("");
      setConfirmPassword("");
      setActive(true);
      setStrength("");
    }
  }, [editingUser, isOpen]);

  useEffect(() => {
    setStrength(checkStrength(password));
  }, [password]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email) return alert("Name and Email are required");

    if (!editingUser) {
      if (!password || !confirmPassword)
        return alert("Password and Confirm Password are required");
      if (password !== confirmPassword)
        return alert("Passwords do not match");
    }

    if (editingUser && password && password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    const payload = { name, email, role, active };
    if (password) payload.password = password;

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-96 shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          {editingUser ? "Edit User" : "Add User"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="text" placeholder="Full Name" value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded w-full" />

          <input type="email" placeholder="Email Address" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full" />

          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="border p-2 rounded w-full">
            <option value="Admin">Admin</option>
            <option value="Office Staff">Office Staff</option>
            <option value="Guard">Guard</option>
          </select>

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder={editingUser ? "New Password (optional)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <span
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-2 cursor-pointer text-sm text-blue-600"
            >
              {showPass ? "Hide" : "Show"}
            </span>
          </div>

          {/* Strength Meter */}
          {password && (
            <div className={`text-sm font-semibold ${
              strength === "Strong" ? "text-green-600" :
              strength === "Medium" ? "text-yellow-600" : "text-red-600"
            }`}>
              Strength: {strength}
            </div>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPass ? "text" : "password"}
              placeholder={editingUser ? "Confirm New Password" : "Confirm Password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <span
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-2 cursor-pointer text-sm text-blue-600"
            >
              {showConfirmPass ? "Hide" : "Show"}
            </span>
          </div>

          {/* Auto-generate for Guard */}
          {role === "Guard" && !editingUser && (
            <button
              type="button"
              onClick={generatePassword}
              className="bg-blue-500 text-white rounded p-2 text-sm hover:bg-blue-600"
            >
              Auto Generate Guard Password
            </button>
          )}

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 accent-blue-500" />
            Active
          </label>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose}
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit"
              className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">
              {editingUser ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
