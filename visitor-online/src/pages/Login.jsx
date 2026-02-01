import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/visitor-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok && data.message) throw new Error(data.message);

      setAlert({ type: "success", message: "Login successful!" });
      setTimeout(() => navigate("/appointment"), 1000);
    } catch (err) {
      setAlert({ type: "error", message: "Login failed" });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        {alert && (
          <div
            style={{
              ...styles.alert,
              ...(alert.type === "success" ? styles.alertSuccess : styles.alertError),
            }}
          >
            {alert.message}
          </div>
        )}
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
        <div style={styles.footer}>
          Don't have an account?{" "}
          <span style={styles.link} onClick={() => navigate("/signup")}>
            Signup
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: "0.75rem",
    border: "1px solid #d1d5db",
    outline: "none",
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
  link: {
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
  },
  alert: {
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    marginBottom: "1rem",
    fontWeight: "500",
  },
  alertSuccess: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  alertError: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
  },
};

export default Login;
