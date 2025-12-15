import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import VisitorRegistration from "./pages/VisitorRegistration";
import OfficePage from "./pages/OfficePage";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import VisitorPublicPage from "./pages/VisitorPublicPage";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [visitors, setVisitors] = useState([]);
  const [isPublicVisitor, setIsPublicVisitor] = useState(false);

  // Check if public visitor page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === "visitor") setIsPublicVisitor(true);
  }, []);

  // Fetch visitors from backend
  const fetchVisitors = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/visitors");
      if (!res.ok) throw new Error("Failed to fetch visitors");
      const data = await res.json();
      // Make sure each visitor has _id (fallback for MongoDB)
      const visitorsWithId = data.map((v) => ({
        ...v,
        _id: v._id || v.id || v.visitorID || Math.random().toString(36).substr(2, 9),
      }));
      setVisitors(visitorsWithId);
    } catch (err) {
      console.error(err);
      alert("Failed to load visitors from backend");
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const getCurrentDateTime = () => new Date().toISOString();

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

  const handleTimeIn = async (id) => {
    try {
      const visitor = visitors.find((v) => v._id === id);
      if (!visitor) return alert("Visitor not found");
      const res = await fetch(`http://localhost:5000/api/visitors/${id}/time-in`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to set Time In");
      const updated = await res.json();
      setVisitors((prev) => prev.map((v) => (v._id === id ? updated : v)));
    } catch (err) {
      console.error(err);
      alert("Failed to set Time In.");
    }
  };

  const handleTimeOut = async (id) => {
    try {
      const visitor = visitors.find((v) => v._id === id);
      if (!visitor) return alert("Visitor not found");
      const res = await fetch(`http://localhost:5000/api/visitors/${id}/time-out`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to set Time Out");
      const updated = await res.json();
      setVisitors((prev) => prev.map((v) => (v._id === id ? updated : v)));
    } catch (err) {
      console.error(err);
      alert("Failed to set Time Out.");
    }
  };

  const startProcessing = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/visitors/${id}/start-processing`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to start processing");
      const updated = await res.json();
      setVisitors((prev) => prev.map((v) => (v._id === id ? updated : v)));
    } catch (err) {
      console.error(err);
      alert("Failed to start processing.");
    }
  };

  const markProcessed = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/visitors/${id}/office-processed`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark processed");
      const updated = await res.json();
      setVisitors((prev) => prev.map((v) => (v._id === id ? updated : v)));
    } catch (err) {
      console.error(err);
      alert("Failed to mark as processed.");
    }
  };

  const updateVisitor = (id, updatedData) => {
    setVisitors((prev) => prev.map((v) => (v._id === id ? { ...v, ...updatedData } : v)));
  };

  const deleteVisitor = (id) => {
    setVisitors((prev) => prev.filter((v) => v._id !== id));
  };

  // Navigation
  const goToLogin = () => setCurrentPage("login");
  const goToGuard = () => setCurrentPage("guard");
  const goToOffice = () => setCurrentPage("office");
  const goToVisitorRegistration = () => setCurrentPage("visitor");
  const goToAdminLogin = () => setCurrentPage("admin-login");
  const goToAdmin = () => setCurrentPage("admin");

  if (isPublicVisitor) return <VisitorPublicPage addVisitor={addVisitor} />;

  const pageComponents = {
    login: <LoginPage goToGuard={goToGuard} goToOffice={goToOffice} goToAdminLogin={goToAdminLogin} />,
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
    office: <OfficePage visitors={visitors} startProcessing={startProcessing} markProcessed={markProcessed} goToLogin={goToLogin} />,
    "admin-login": <AdminLogin goToAdmin={goToAdmin} />,
    admin: <AdminPage visitors={visitors} updateVisitor={updateVisitor} deleteVisitor={deleteVisitor} goToLogin={goToLogin} />,
  };

  return <>{pageComponents[currentPage]}</>;
}

export default App;
