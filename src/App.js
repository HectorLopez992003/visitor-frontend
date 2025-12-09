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

  // Check URL for public visitor page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === "visitor") {
      setIsPublicVisitor(true);
    }
  }, []);

  // Visitor handlers
  const getCurrentDateTime = () => new Date().toLocaleString();

  const addVisitor = (visitor) => {
    setVisitors((prev) => [
      ...prev,
      {
        ...visitor,
        processed: false,
        timeIn: visitor.timeIn || null,
        timeOut: null,
        processingStartedTime: null,
        officeProcessedTime: null,
      },
    ]);
  };

  // Other visitor functions
  const handleTimeIn = (index) => {
    setVisitors((prev) =>
      prev.map((v, i) => (i === index ? { ...v, timeIn: getCurrentDateTime() } : v))
    );
  };

  const handleTimeOut = (index) => {
    setVisitors((prev) =>
      prev.map((v, i) => (i === index ? { ...v, timeOut: getCurrentDateTime() } : v))
    );
  };

  const startProcessing = (index) => {
    setVisitors((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, processingStartedTime: getCurrentDateTime() } : v
      )
    );
  };

  const markProcessed = (index) => {
    setVisitors((prev) =>
      prev.map((v, i) =>
        i === index
          ? { ...v, processed: true, officeProcessedTime: getCurrentDateTime() }
          : v
      )
    );
  };

  // Admin handlers
  const updateVisitor = (index, updatedData) => {
    setVisitors((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...updatedData } : v))
    );
  };

  const deleteVisitor = (index) => {
    setVisitors((prev) => prev.filter((_, i) => i !== index));
  };

  // Navigation handlers
  const goToLogin = () => setCurrentPage("login");
  const goToGuard = () => setCurrentPage("guard");
  const goToOffice = () => setCurrentPage("office");
  const goToVisitorRegistration = () => setCurrentPage("visitor");
  const goToAdminLogin = () => setCurrentPage("admin-login");
  const goToAdmin = () => setCurrentPage("admin");

  // --- LOCKDOWN: if public visitor, render ONLY the public page ---
  if (isPublicVisitor) {
    return <VisitorPublicPage addVisitor={addVisitor} />;
  }

  // --- STAFF PAGES ---
  const pageComponents = {
    login: (
      <LoginPage
        goToGuard={goToGuard}
        goToOffice={goToOffice}
        goToAdminLogin={goToAdminLogin}
      />
    ),
    guard: (
      <>
        <button
          onClick={goToLogin}
          className="m-4 p-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Logout
        </button>
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
        <button
          onClick={goToGuard}
          className="m-4 p-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back to Guard Page
        </button>
        <VisitorRegistration addVisitor={addVisitor} />
      </>
    ),
    office: (
      <OfficePage
        visitors={visitors}
        startProcessing={startProcessing}
        markProcessed={markProcessed}
        goToLogin={goToLogin}
      />
    ),
    "admin-login": <AdminLogin goToAdmin={goToAdmin} />,
    admin: (
      <AdminPage
        visitors={visitors}
        updateVisitor={updateVisitor}
        deleteVisitor={deleteVisitor}
        goToLogin={goToLogin}
      />
    ),
  };

  return <>{pageComponents[currentPage]}</>;
}

export default App;
