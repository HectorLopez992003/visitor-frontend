import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import VisitorRegistration from "./pages/VisitorRegistration";
import OfficePage from "./pages/OfficePage";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import VisitorPublicPage from "./pages/VisitorPublicPage";
import OfficeLoginForm from "./pages/OfficeLoginForm";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [visitors, setVisitors] = useState([]);
  const [isPublicVisitor, setIsPublicVisitor] = useState(false);
  const [officeToken, setOfficeToken] = useState(localStorage.getItem("token") || null);
  const [officeRole, setOfficeRole] = useState(localStorage.getItem("role") || null);

  // -------------------- Public Visitor Check --------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === "visitor") setIsPublicVisitor(true);
  }, []);

  // -------------------- Fetch Visitors --------------------
  const fetchVisitors = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/visitors");
      if (!res.ok) throw new Error("Failed to fetch visitors");
      const data = await res.json();
      const visitorsWithId = data.map((v) => ({
        ...v,
        _id: v._id || v.id || v.contactNumber || Math.random().toString(36).substr(2, 9),
      }));
      setVisitors(visitorsWithId);
    } catch (err) {
      console.warn("Initial visitor fetch failed (ignored):", err.message);
    }
  };

  useEffect(() => { fetchVisitors(); }, []);

  // -------------------- Visitor Actions --------------------
  const addVisitor = async (visitor, callback) => {
    try {
      const res = await fetch("http://localhost:5000/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitor),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setVisitors((prev) => [saved, ...prev]);
      if (callback) callback();
    } catch (err) {
      console.error("❌ Failed to save visitor:", err);
      alert("❌ Failed to save visitor. Try again.");
    }
  };

  const handleTimeIn = async (id) => { /* same as before */ };
  const handleTimeOut = async (id) => { /* same as before */ };
  const startProcessing = async (id) => { /* same as before */ };
  const markProcessed = async (id) => { /* same as before */ };
  const updateVisitor = (id, updatedData) => setVisitors(prev => prev.map(v => v._id === id ? { ...v, ...updatedData } : v));
  const deleteVisitor = (id) => setVisitors(prev => prev.filter(v => v._id !== id));

  // -------------------- Navigation --------------------
  const goToLogin = () => {
    setCurrentPage("login");
    setOfficeToken(null);
    setOfficeRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };
  const goToGuard = () => setCurrentPage("guard");
  const goToVisitorRegistration = () => setCurrentPage("visitor");
  const goToAdminLogin = () => setCurrentPage("admin-login");
  const goToAdmin = () => setCurrentPage("admin");
  const goToOfficeLogin = () => setCurrentPage("office-login");

  const handleOfficeLoginSuccess = (token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setOfficeToken(token);
    setOfficeRole(role);
    if (role === "admin") setCurrentPage("admin");
    else setCurrentPage("office");
  };

  if (isPublicVisitor) return <VisitorPublicPage addVisitor={addVisitor} />;

  // -------------------- Page Components --------------------
  const pageComponents = {
    login: <LoginPage goToGuard={goToGuard} goToOffice={goToOfficeLogin} goToAdminLogin={goToAdminLogin} />,
    "office-login": <OfficeLoginForm onLoginSuccess={handleOfficeLoginSuccess} />,
    guard: (
      <>
        <button onClick={goToLogin} className="m-4 p-2 bg-gray-200 rounded hover:bg-gray-300">Logout</button>
        <MainPage
          visitors={visitors}
          handleTimeIn={handleTimeIn}
          handleTimeOut={handleTimeOut}
          goToVisitorManagement={goToVisitorRegistration}
        />
      </>
    ),
    visitor: (
      <>
        <button onClick={goToGuard} className="m-4 p-2 bg-gray-200 rounded hover:bg-gray-300">Back to Guard Page</button>
        <VisitorRegistration addVisitor={addVisitor} />
      </>
    ),
    office: (
      <OfficePage
        visitors={visitors}
        newVisitor={null}
        startProcessing={startProcessing}
        markProcessed={markProcessed}
        goToLogin={goToLogin}
        token={officeToken}
      />
    ),
    "admin-login": <AdminLogin goToAdmin={goToAdmin} />,
    admin: <AdminPage visitors={visitors} updateVisitor={updateVisitor} deleteVisitor={deleteVisitor} goToLogin={goToLogin} />,
  };

  return <>{pageComponents[currentPage]}</>;
}

export default App;
