import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("+639");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState(null);

  const navigate = useNavigate();

  // REGISTER account
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/visitor-auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, contactNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setAlert({ type: "success", message: "Account created! You can now login." });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>

        {alert && (
          <div
            style={{
              ...styles.alert,
              ...(alert.type === "success"
                ? styles.alertSuccess
                : styles.alertError),
            }}
          >
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            required
          />

          <input
            type="text"
            placeholder="Contact Number (+639XXXXXXXXX)"
            value={contactNumber}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, "");
              if (!val.startsWith("639")) val = "639" + val.slice(3);
              setContactNumber("+" + val);
            }}
            style={styles.input}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
            <span
              style={styles.showHide}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
            />
            <span
              style={styles.showHide}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </span>
          </div>

          <button type="submit" style={styles.button}>
            Signup
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account?{" "}
          <span style={styles.link} onClick={() => navigate("/login")}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #dbeafe, #ede9fe, #fee2e2)",
  },
  card: {
    background: "#fff",
    borderRadius: "2rem",
    padding: "3rem",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    color: "#1f2937",
  },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: {
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: "0.75rem",
    border: "1px solid #d1d5db",
    outline: "none",
    width: "100%",
  },
  showHide: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#2563eb",
    fontWeight: "600",
    userSelect: "none",
  },
  button: {
    padding: "0.75rem 1rem",
    background: "linear-gradient(to right, #3b82f6, #2563eb)",
    color: "#fff",
    fontWeight: "600",
    borderRadius: "1rem",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.2s",
  },
  footer: {
    marginTop: "1rem",
    fontSize: "0.875rem",
    color: "#6b7280",
  },
  link: { color: "#2563eb", cursor: "pointer", fontWeight: "600" },
  alert: { padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1rem", fontWeight: "500" },
  alertSuccess: { backgroundColor: "#d1fae5", color: "#065f46" },
  alertError: { backgroundColor: "#fee2e2", color: "#b91c1c" },
};

export default Signup;
