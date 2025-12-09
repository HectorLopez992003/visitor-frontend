import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import VisitorRegistration from "./pages/VisitorRegistration";
import OfficePage from "./pages/OfficePage";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import VisitorPublicPage from "./pages/VisitorPublicPage"; // Public visitor page

function App() {
  const [currentPage, setCurrentPage] = useState("login"); 
  const [visitors, setVisitors] = useState([]);

  // Navigation handlers
  const goToLogin = () => setCurrentPage("login");
  const goToGuard = () => setCurrentPage("guard");
  const goToOffice = () => setCurrentPage("office");
  const goToVisitorRegistration = () => setCurrentPage("visitor");
  const goToAdminLogin = () => setCurrentPage("admin-login");
  const goToAdmin = () => setCurrentPage("admin");
  const goToVisitorPublic = () => setCurrentPage("visitor-public"); // New public page

  // Visitor handlers
  const addVisitor = (visitor) => {
    setVisitors((prev) => [
      ...prev,
      {
        ...visitor,
        processed: false,
        timeIn: null,
        timeOut: null,
        processingStartedTime: null,
        officeProcessedTime: null,
      },
    ]);
  };

  const getCurrentDateTime = () => new Date().toLocaleString();

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

  return (
    <>
      {/* --- Public Visitor Registration --- */}
      {currentPage === "visitor-public" && (
        <VisitorPublicPage addVisitor={addVisitor} />
      )}

      {/* --- Login Page --- */}
      {currentPage === "login" && (
        <LoginPage
          goToGuard={goToGuard}
          goToOffice={goToOffice}
          goToAdminLogin={goToAdminLogin}
          goToVisitorPublic={goToVisitorPublic} // Optional: link for public access
        />
      )}

      {/* --- Guard Page --- */}
      {currentPage === "guard" && (
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
      )}

      {/* --- Internal Visitor Registration (Guard only) --- */}
      {currentPage === "visitor" && (
        <>
          <button
            onClick={goToGuard}
            className="m-4 p-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Back to Guard Page
          </button>
          <VisitorRegistration addVisitor={addVisitor} />
        </>
      )}

      {/* --- Office Page --- */}
      {currentPage === "office" && (
        <OfficePage
          visitors={visitors}
          startProcessing={startProcessing}
          markProcessed={markProcessed}
          goToLogin={goToLogin}
        />
      )}

      {/* --- Admin Login --- */}
      {currentPage === "admin-login" && (
        <AdminLogin goToAdmin={goToAdmin} />
      )}

      {/* --- Admin Page --- */}
      {currentPage === "admin" && (
        <AdminPage
          visitors={visitors}
          updateVisitor={updateVisitor}
          deleteVisitor={deleteVisitor}
          goToLogin={goToLogin}
        />
      )}
    </>
  );
}

export default App;
