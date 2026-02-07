import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import VisitorRegistration from "./pages/VisitorRegistration";
import OfficePage from "./pages/OfficePage";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import VisitorPublicPage from "./pages/VisitorPublicPage";
import OfficeLogin from "./pages/OfficeLogin";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [visitors, setVisitors] = useState([]);
  const [newVisitor, setNewVisitor] = useState(null); // ✅ added
  const [isPublicVisitor, setIsPublicVisitor] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ---------------- PUBLIC VISITOR CHECK ----------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === "visitor") setIsPublicVisitor(true);
  }, []);

  // ---------------- LOAD CURRENT USER FROM LOCALSTORAGE ----------------
  useEffect(() => {
    const savedUser = localStorage.getItem("officeUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentPage("office"); // Auto-redirect if user exists
    }
  }, []);

  // ---------------- FETCH VISITORS ----------------
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
      console.warn("Initial visitor fetch failed:", err.message);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // ---------------- VISITOR FUNCTIONS ----------------
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
      setNewVisitor(saved); // ✅ push to OfficePage
      if (callback) callback();
    } catch (err) {
      console.error("Failed to save visitor:", err);
      alert("Failed to save visitor. Try again.");
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

  // ---------------- NAVIGATION ----------------
  const goToLogin = () => {
    localStorage.removeItem("officeUser");
    localStorage.removeItem("officeToken"); // ✅ remove token
    setCurrentUser(null);
    setCurrentPage("login");
  };
  const goToGuard = (user) => {
    setCurrentUser(user);
    setCurrentPage("guard");
  };
  const goToVisitorRegistration = () => setCurrentPage("visitor");
  const goToOffice = (user) => {
    setCurrentUser(user);
    setCurrentPage("office");
  };
  const goToAdminLogin = () => setCurrentPage("admin-login");
  const goToAdmin = (user) => {
    setCurrentUser(user);
    setCurrentPage("admin");
  };
  const goToOfficeLogin = () => setCurrentPage("office-login");

  // ---------------- OFFICE LOGIN ----------------
  const handleOfficeLogin = (user) => {
    if (!user) return alert("Login failed!");
    console.log("Office user logged in:", user);
    setCurrentUser(user);
    localStorage.setItem("officeUser", JSON.stringify(user));
    if (user.token) localStorage.setItem("officeToken", user.token); // ✅ save token
    setCurrentPage("office");
  };

  if (isPublicVisitor) return <VisitorPublicPage addVisitor={addVisitor} />;

  // ---------------- PAGE COMPONENTS ----------------
  const pageComponents = {
    login: <LoginPage goToGuard={goToGuard} goToOfficeLogin={goToOfficeLogin} goToAdminLogin={goToAdminLogin} />,
    "office-login": <OfficeLogin onLogin={handleOfficeLogin} goBack={goToLogin} />,
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
    office: currentUser ? (
      <OfficePage
        visitors={visitors}
        newVisitor={newVisitor} // ✅ pass newVisitor for live updates
        goToLogin={goToLogin}
        currentUser={currentUser}
      />
    ) : (
      <LoginPage goToGuard={goToGuard} goToOfficeLogin={goToOfficeLogin} goToAdminLogin={goToAdminLogin} />
    ),
    "admin-login": <AdminLogin goToAdmin={goToAdmin} />,
    admin: (
      <AdminPage
        visitors={visitors}
        updateVisitor={updateVisitor}
        deleteVisitor={deleteVisitor}
        goToLogin={goToLogin}
        currentUser={currentUser}
      />
    ),
  };

  return <>{pageComponents[currentPage]}</>;
}

export default App;
