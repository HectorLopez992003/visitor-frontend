import React, { useState, useEffect, useRef } from "react";
import IDPreviewModal from "../components/IDPreviewModal";
import UserModal from "../components/UserModal"; // ✅ Added UserModal import
import { Html5Qrcode } from "html5-qrcode";
import { API_BASE } from "../api";

const OfficePage = ({ goToLogin, newVisitor, currentUser, visitors }) => {

  // -------------------- STATES --------------------
  const [localVisitors, setLocalVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("Admin"); 
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOffice, setFilterOffice] = useState("All");
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [modalName, setModalName] = useState("");

  // Scanner states
  const [scanning, setScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [lastScanTimes, setLastScanTimes] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const scannerRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Audit Trail & Reports
  const [auditTrail, setAuditTrail] = useState([]);
  const [reportData, setReportData] = useState([]);

  // User Management
  const [users, setUsers] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // -------------------- SET VISITORS FROM PROP --------------------
useEffect(() => {
  if (visitors && visitors.length) {
    setLocalVisitors(visitors);
  }
}, [visitors]);

useEffect(() => {
  setLoading(false);
}, [localVisitors]);

  // -------------------- TOAST --------------------
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // -------------------- UTILS --------------------
  const highlightMatch = (text) => {
    if (!text) return "-";
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-bold">{part}</span>
      ) : (
        <span key={index} className="font-semibold">{part}</span>
      )
    );
  };

  const isOverdue = (v) => {
    if (v.officeProcessedTime && !v.timeOut) {
      const now = Date.now();
      const processedTime = new Date(v.officeProcessedTime).getTime();
      return now - processedTime > 30 * 60 * 1000;
    }
    return false;
  };

  const getStatusBadge = (v) => {
    if (isOverdue(v))
      return <span className="px-2 py-1 rounded-full bg-red-300 text-red-900 font-bold text-sm">Overdue</span>;
    if (v.processed)
      return <span className="px-2 py-1 rounded-full bg-green-300 text-green-900 font-bold text-sm">Processed</span>;
    if (v.processingStartedTime)
      return <span className="px-2 py-1 rounded-full bg-blue-300 text-blue-900 font-bold text-sm">Processing</span>;
    if (v.accepted === true)
      return <span className="px-2 py-1 rounded-full bg-green-200 text-green-900 font-bold text-sm">Accepted</span>;
    if (v.accepted === false)
      return <span className="px-2 py-1 rounded-full bg-red-200 text-red-900 font-bold text-sm">Declined</span>;
    return <span className="px-2 py-1 rounded-full bg-yellow-300 text-yellow-900 font-bold text-sm">Pending</span>;
  };

  const getCardBackground = (v) => {
    if (isOverdue(v)) return "bg-red-50";
    if (v.processed) return "bg-green-50";
    if (v.processingStartedTime) return "bg-blue-50";
    return "bg-yellow-50";
  };

  const formatTime = (value) => {
    if (!value) return "-";
    if (!isNaN(new Date(value))) return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (typeof value === "string" && value.includes(":")) {
      const [hour, minute] = value.split(":").map(Number);
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
    return "-";
  };

  const formatDateMMDDYYYY = (datetime) => {
    if (!datetime) return "-";
    const d = new Date(datetime);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const isToday = (datetime) => datetime ? new Date(datetime).toDateString() === new Date().toDateString() : false;

const fetchAuditTrail = async () => {
  try {
    let url = `${API_BASE}/audit-trail`;

    // Include office for Office Staff only
    if (currentUser?.role === "Office Staff") {
      url += `?office=${encodeURIComponent(currentUser.office)}`;
    }

    const token = localStorage.getItem("officeToken");
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn("Audit trail not found, skipping:", res.status);
      setAuditTrail([]);
      return;
    }

    const data = await res.json();
    setAuditTrail(data);
  } catch (err) {
    console.error("Failed to fetch audit trail:", err);
    setAuditTrail([]);
  }
};

const fetchUsers = async () => {
  try {
    const token = localStorage.getItem("officeToken");
    if (!token) return showToast("No token found. Please login.", "error");

    const res = await fetch(`${API_BASE}/users`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch users");
    setUsers(data);
  } catch (err) {
    console.error("Error fetching users:", err);
    showToast(err.message || "Failed to load users from backend", "error");
  }
};

// Add new visitor live
useEffect(() => {
  if (newVisitor) setLocalVisitors(prev => [newVisitor, ...prev]);
}, [newVisitor]);

const fetchVisitors = async () => {
  try {
    const res = await fetch(`${API_BASE}/visitors`);
    if (!res.ok) throw new Error("Failed to fetch visitors");
    const data = await res.json();
    setLocalVisitors(data);
  } catch (err) {
    console.error(err);
    showToast("Failed to fetch visitors", "error");
  }
};

// Auto refresh visitors & audit
useEffect(() => {
  fetchVisitors();
  fetchAuditTrail(); // fetch immediately
  const interval = setInterval(() => {
    fetchVisitors();
    fetchAuditTrail();
  }, 10000);
  return () => clearInterval(interval);
}, []);

// Fetch users when admin logs in
useEffect(() => {
  if (["Admin", "Super Admin"].includes(currentUser?.role)) {
    fetchUsers();
  }
}, [currentUser]);

  // -------------------- PROCESSING --------------------
  const startProcessing = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/visitors/${id}/start-processing`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to start processing");
      const updatedVisitor = await res.json();
      setLocalVisitors(prev => prev.map(v => v._id === updatedVisitor._id ? updatedVisitor : v));
      showToast(`✅ Processing Started: ${updatedVisitor.name}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to start processing.", "error");
    }
  };

  const markProcessed = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/visitors/${id}/office-processed`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark as processed");
      const updatedVisitor = await res.json();
      setLocalVisitors(prev => prev.map(v => v._id === updatedVisitor._id ? updatedVisitor : v));
      showToast(`✅ Processed: ${updatedVisitor.name}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to mark as processed.", "error");
    }
  };

  // ---------------- ACCEPT / DECLINE ----------------
  const handleAcceptDecline = async (id, accept) => {
    try {
      const res = await fetch(`${API_BASE}/visitors/${id}/accept-decline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: accept }),
      });
      if (!res.ok) throw new Error("Failed to update visitor status");
      const updatedVisitor = await res.json();
      setLocalVisitors(prev => prev.map(v => v._id === updatedVisitor._id ? updatedVisitor : v));
      showToast(`Visitor ${updatedVisitor.name} ${accept ? "Accepted ✅" : "Declined ❌"}`);

      await fetch(`${API_BASE}/visitors/${id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: accept, email: updatedVisitor.email, name: updatedVisitor.name })
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to update visitor status", "error");
    }
  };

const toggleUserStatus = async (userId) => {
  try {
    const token = localStorage.getItem("officeToken"); // ✅ get the token properly
    if (!token) return showToast("No token found. Please login.", "error");

    const user = users.find(u => u._id === userId);
    if (!user) return;

    const res = await fetch(`${API_BASE}/users/${userId}/toggle-status`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` // ✅ correct token
      },
      body: JSON.stringify({ active: !user.active }),
    });

    if (!res.ok) throw new Error("Failed to toggle user status");

    const updatedUser = await res.json();
    setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
    showToast(`User ${updatedUser.name} is now ${updatedUser.active ? "Active ✅" : "Inactive ❌"}`);
  } catch (err) {
    console.error(err);
    showToast("Failed to update user status", "error");
  }
};

  // ✅ Add delete user function
const deleteUser = async (userId) => {
  const userConfirmed = window.confirm("Are you sure you want to delete this user?");
  if (!userConfirmed) return;

  try {
    const token = localStorage.getItem("officeToken");
    console.log("Token in deleteUser:", token); // ✅ Debug token
    if (!token) return showToast("No token found. Please login.", "error");

    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json", // ✅ Ensure Content-Type is set
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("Delete error response:", errData);
      throw new Error(errData.message || "Failed to delete user");
    }

    setUsers(prev => prev.filter(u => u._id !== userId));
    showToast("User deleted successfully", "success");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Failed to delete user", "error");
  }
};

const saveUser = async (userData) => {
  try {
    const token = localStorage.getItem("officeToken");
    if (!token) {
      showToast("No token found. Please login.", "error");
      return;
    }

    const method = editingUser ? "PUT" : "POST";
    const url = editingUser ? `${API_BASE}/users/${editingUser._id}` : `${API_BASE}/users`;

    const res = await fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` // ✅ include token
      },
      body: JSON.stringify(userData),
    });

    if (!res.ok) throw new Error("Failed to save user");

    const savedUser = await res.json();
    setUsers(prev => editingUser ? prev.map(u => u._id === savedUser._id ? savedUser : u) : [savedUser, ...prev]);

    showToast(`User ${savedUser.name} saved successfully`);
    setUserModalOpen(false);
    setEditingUser(null);
  } catch (err) {
    console.error(err);
    showToast("Failed to save user", "error");
  }
};

  // -------------------- FILTERED VISITORS --------------------
  const filteredVisitors = localVisitors.filter((v) => {
    const matchesSearch =
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.office?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.purpose?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === "Pending") matchesStatus = !v.processingStartedTime && !v.processed && !isOverdue(v);
    if (filterStatus === "Processing") matchesStatus = v.processingStartedTime && !v.processed && !isOverdue(v);
    if (filterStatus === "Processed") matchesStatus = v.processed;
    if (filterStatus === "Overdue") matchesStatus = isOverdue(v);

    const matchesOffice = filterOffice === "All" ? true : v.office?.toLowerCase() === filterOffice.toLowerCase();
    const matchesToday = showTodayOnly ? isToday(v.timeIn) : true;
    const matchesDate = filterDate
      ? v.timeIn
        ? new Date(v.timeIn).toISOString().slice(0, 10) === filterDate
        : v.scheduledDate
        ? new Date(v.scheduledDate).toISOString().slice(0, 10) === filterDate
        : false
      : true;

    return matchesSearch && matchesStatus && matchesOffice && matchesToday && matchesDate;
  });

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  const paginatedVisitors = filteredVisitors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // -------------------- QR SCANNER --------------------
  const startScanner = () => { if (scanning) return; setScanning(true); };
  const stopScanner = () => {
    if (scannerInstance) {
      scannerInstance.stop().finally(() => { setScanning(false); setScannerInstance(null); });
    } else setScanning(false);
  };

  useEffect(() => {
    if (scanning && scannerRef.current) {
      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      setScannerInstance(html5QrCode);

      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 25, qrbox: { width: 300, height: 300 }, experimentalFeatures: { useBarCodeDetectorIfSupported: true }, disableFlip: false, verbose: true },
        (decodedText) => {
          let visitorData;
          try { visitorData = JSON.parse(decodedText); } catch { visitorData = { contactNumber: decodedText }; }

          const visitor = localVisitors.find((v) => v.contactNumber === visitorData.contactNumber && v.accepted);
          if (!visitor) { showToast("QR does not match any accepted visitor!", "error"); return; }

          const now = Date.now();
          const lastScan = lastScanTimes[visitor.contactNumber] || 0;
          if (now - lastScan < 2000) return;
          setLastScanTimes({ ...lastScanTimes, [visitor.contactNumber]: now });

          if (!visitor.processingStartedTime) startProcessing(visitor._id);
          else if (!visitor.processed) markProcessed(visitor._id);
          else showToast(`${visitor.name} is already completed.`, "info");

          html5QrCode.stop().finally(() => { setScanning(false); setScannerInstance(null); });
        },
        (error) => console.warn("QR Scan Error:", error)
      ).catch((err) => { console.error("Unable to start QR scan:", err); setScanning(false); });
    }
  }, [scanning, localVisitors]);

  if (loading) return <div className="text-center mt-20 font-bold text-gray-700">Loading visitors...</div>;

  // -------------------- MAIN RETURN --------------------
  return (
  <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen relative">

    {/* ---------------- LOGGED IN USER INFO ---------------- */}
    <div className="flex justify-between items-center mb-4 bg-white shadow p-3 rounded">
      <div className="font-semibold text-gray-700">
        Logged in as:{" "}
        <span className="font-bold text-black">{currentUser?.name}</span>
        <span className="ml-3 px-2 py-1 text-xs rounded bg-blue-600 text-white">
          {currentUser?.role}
        </span>
      </div>

      <button
        onClick={goToLogin}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>

    {/* TOAST */}
    {toast && (
        <div className={`fixed top-6 right-6 px-4 py-2 rounded shadow text-white font-semibold ${toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"} z-50`}>
          {toast.message}
        </div>
      )}

      {/* SCANNER PANEL */}
      <div className="fixed top-24 right-6 z-40 w-60 flex flex-col items-center gap-2">
        <button onClick={startScanner} disabled={scanning} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-semibold text-sm w-full">
          {scanning ? "Scanning..." : "Start Scanner"}
        </button>
        {scanning && <>
          <button onClick={stopScanner} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition font-semibold text-sm w-full">Stop Scanner</button>
          <div ref={scannerRef} id="office-qr-reader" className="w-full h-56 overflow-hidden rounded border" />
          <style>{`#office-qr-reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }`}</style>
        </>}
      </div>

      {/* ---------------- FILTERS & LOGOUT ---------------- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
        <button onClick={goToLogin} className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 font-semibold">Logout</button>
        <input type="text" placeholder="Search by Name, Contact Number, Office, or Purpose" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border p-2 rounded w-full md:w-64 font-semibold" />
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="border p-2 rounded w-full md:w-48 font-semibold" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border p-2 rounded w-full md:w-48 font-semibold">
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Processed">Processed</option>
          <option value="Overdue">Overdue</option>
        </select>
        <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} className="border p-2 rounded w-full md:w-48 font-semibold">
          <option value="All">All Offices</option>
          <option value="Registrar">Registrar</option>
          <option value="Guidance">Guidance</option>
          <option value="Cashier">Cashier</option>
          <option value="Dean">Dean</option>
          <option value="Library">Library</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer font-semibold">
          <input type="checkbox" checked={showTodayOnly} onChange={() => setShowTodayOnly(!showTodayOnly)} className="w-4 h-4 accent-blue-500" /> Today Only
        </label>
      </div>

      {/* ---------------- VISITOR CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedVisitors.map((v) => (
          <div key={v._id} className={`rounded-lg shadow-lg p-4 flex flex-col gap-2 border ${getCardBackground(v)} transition transform hover:-translate-y-1 hover:shadow-2xl`}>
            {/* ACCEPT / DECLINE BUTTONS */}
            {v.accepted === null && !v.processingStartedTime && !v.processed && !isOverdue(v) && (
              <div className="flex justify-end gap-2 mb-2">
                <button onClick={() => handleAcceptDecline(v._id, true)} className="bg-green-600 text-white px-3 py-1 rounded font-bold">✔</button>
                <button onClick={() => handleAcceptDecline(v._id, false)} className="bg-red-600 text-white px-3 py-1 rounded font-bold">✖</button>
              </div>
            )}

            {/* ACCEPTED / DECLINED TAG */}
            {v.accepted === true && <span className="px-2 py-1 rounded-full text-xs font-bold mb-1 inline-block text-center" style={{ minWidth: "350px", backgroundColor: "#C6F6D5", color: "#22543D" }}>Accepted ✅</span>}
            {v.accepted === false && <span className="px-2 py-1 rounded-full text-xs font-bold mb-1 inline-block text-center" style={{ minWidth: "350px", backgroundColor: "#FEB2B2", color: "#742A2A" }}>Declined ❌</span>}

            <h2 className="text-xl font-bold text-black">{highlightMatch(v.name)}</h2>
            <p className="text-gray-800 font-semibold">{highlightMatch(v.contactNumber)}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Office:</span> {highlightMatch(v.office)}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Email:</span> {highlightMatch(v.email) || "-"}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Purpose:</span> {highlightMatch(v.purpose)}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Scheduled Date:</span> {v.scheduledDate ? formatDateMMDDYYYY(v.scheduledDate) : "-"}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Scheduled Time:</span> {v.scheduledTime ? formatTime(v.scheduledTime) : "-"}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Date In:</span> {v.timeIn ? formatDateMMDDYYYY(v.timeIn) : "-"}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Processing Started:</span> {formatTime(v.processingStartedTime)}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Office Processed:</span> {formatTime(v.officeProcessedTime)}</p>
            <div className="my-3">{getStatusBadge(v)}</div>

            {v.overdueEmailSent && (
              <span className="inline-flex w-fit self-start px-3 py-1 rounded-md bg-blue-600 text-white font-semibold text-sm">Email sent</span>
            )}

            {v.idFile && (
              <div className="relative w-full h-32 overflow-hidden rounded border cursor-pointer group" onClick={() => { setModalImage(v.idFile); setModalName(v.name); setModalOpen(true); }}>
                <img src={v.idFile} alt="ID" className="w-full h-full object-contain transition group-hover:scale-105"/>
              </div>
            )}

            {/* Bottom status / action */}
            {v.accepted === null && !v.processingStartedTime && !v.processed && !isOverdue(v) ? (
              <p className="text-center font-bold mt-3 text-gray-700">Pending</p>
            ) : v.accepted === true && !v.processingStartedTime ? (
              <button onClick={() => startProcessing(v._id)} className="bg-blue-600 text-white px-3 py-1 rounded w-full font-bold mt-3">Start Processing</button>
            ) : v.accepted === true && !v.processed ? (
              <button onClick={() => markProcessed(v._id)} className="bg-green-600 text-white px-3 py-1 rounded w-full font-bold mt-3">Done Processing</button>
            ) : v.accepted === true && v.processed ? (
              <p className="text-center font-bold mt-3 text-green-700">Processed</p>
            ) : v.accepted === false ? (
              <p className="text-center font-bold mt-3 text-red-700">Declined</p>
            ) : isOverdue(v) ? (
              <p className="text-center font-bold mt-3 text-red-700">Overdue</p>
            ) : null}
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-300 hover:bg-gray-400"}`}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">Next</button>
        </div>
      )}

      {/* ---------------- ID MODAL ---------------- */}
      <IDPreviewModal isOpen={modalOpen} onClose={() => setModalOpen(false)} imageSrc={modalImage} visitorName={modalName} />

      {/* ---------------- AUDIT TRAIL ---------------- */}
      <div className="mt-10 bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold mb-2">Audit Trail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-1 border-b">Visitor</th>
                <th className="px-3 py-1 border-b">Action</th>
                <th className="px-3 py-1 border-b">Performed By</th>
                <th className="px-3 py-1 border-b">Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map((a) => (
                <tr key={a._id}>
                  <td className="px-3 py-1 border-b">{a.visitorName}</td>
                  <td className="px-3 py-1 border-b">{a.action}</td>
                  <td className="px-3 py-1 border-b">
  {a.performedBy || "System"}
</td>
                  <td className="px-3 py-1 border-b">{new Date(a.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

{/* ---------------- USER MANAGEMENT ---------------- */}
{["Admin", "Super Admin"].includes(currentUser?.role) && (
  <div className="mt-10 bg-white shadow rounded p-4">
    <h2 className="text-lg font-bold mb-2">User Management</h2>

    {/* ✅ User counts */}
    <p className="mb-2 font-semibold">
      Total Users: {users.length} | Active: {users.filter(u => u.active).length} | Inactive: {users.filter(u => !u.active).length}
    </p>

    <button className="bg-green-600 text-white px-3 py-1 rounded mb-2" onClick={() => setUserModalOpen(true)}>Add User</button>
    
    <div className="overflow-x-auto">
      {users.length === 0 ? (
        <p className="text-gray-500 font-semibold">No users found or still loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-3 py-1 border-b">Name</th>
              <th className="px-3 py-1 border-b">Role</th>
              <th className="px-3 py-1 border-b">Status</th>
              <th className="px-3 py-1 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td className="px-3 py-1 border-b">{u.name}</td>
                <td className="px-3 py-1 border-b">{u.role}</td>
                <td className="px-3 py-1 border-b">{u.active ? "Active" : "Inactive"}</td>
                <td className="px-3 py-1 border-b">
                  <button onClick={() => { setEditingUser(u); setUserModalOpen(true); }} className="text-blue-600 font-bold mr-2">Edit</button>
                  <button onClick={() => toggleUserStatus(u._id)} className="text-red-600 font-bold mr-2">{u.active ? "Deactivate" : "Activate"}</button>
                  <button onClick={() => deleteUser(u._id)} className="text-gray-700 font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
)}
      {/* ---------------- USER MODAL ---------------- */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => { setUserModalOpen(false); setEditingUser(null); }}
        onSave={saveUser}
        editingUser={editingUser}
      />

    </div>
  );
};

export default OfficePage;

