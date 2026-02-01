import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";
import IDPreviewModal from "../components/IDPreviewModal";
import { API_BASE } from "../api";

const AdminPage = ({ goToLogin }) => {
  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [modalName, setModalName] = useState("");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackVisitorName, setFeedbackVisitorName] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Centralized fetch function
const fetchVisitors = async () => {
  try {
    const [visitorsRes, appointmentsRes] = await Promise.all([
      fetch(`${API_BASE}/visitors`),
      fetch(`${API_BASE}/appointments`)
    ]);

    if (!visitorsRes.ok || !appointmentsRes.ok) return;

    const visitorsData = await visitorsRes.json();
    const appointmentsData = await appointmentsRes.json();

    // Merge appointment feedback into visitor safely
    const merged = visitorsData.map(visitor => {
  const appointment = appointmentsData.find(a => 
    a.contactNumber.replace(/\D/g,"") === visitor.contactNumber.replace(/\D/g,"")
  );
  return { ...visitor, feedback: appointment?.feedback || "" };
});

    setVisitors(merged);
  } catch (err) {
    console.warn("Fetch error ignored:", err);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchVisitors();
  }, []);

  // Polling every 10 seconds to auto-refresh visitors and feedback
  useEffect(() => {
    const interval = setInterval(fetchVisitors, 10000);
    return () => clearInterval(interval);
  }, []);

  // Highlight search text
  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="bg-yellow-300">{part}</span> : part
    );
  };

  const formatDateMMDDYYYY = (value) => value ? new Date(value).toLocaleDateString("en-US") : "-";
  const formatDateMMDDYY = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return `${String(d.getMonth() + 1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
  };
  const formatTime12 = (value) => value ? new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "-";
  const formatScheduledTime = (value) => {
    if (!value) return "-";
    if (typeof value === "string" && value.includes(":")) {
      const [h, m] = value.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return formatTime12(d);
    }
    return "-";
  };

  const isOverdue = (v) => {
    if (v.officeProcessedTime && !v.timeOut) {
      const now = Date.now();
      const processedTime = new Date(v.officeProcessedTime).getTime();
      return now - processedTime > 30 * 60 * 1000;
    }
    return false;
  };

  const filteredVisitors = visitors.filter(v => {
    const searchMatch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contactNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false); // ✅ add email

    let dateMatch = true;
    if (todayOnly) {
      const todayStr = new Date().toISOString().slice(0,10);
      dateMatch = v.timeIn
        ? new Date(v.timeIn).toISOString().slice(0,10) === todayStr
        : v.scheduledDate
        ? new Date(v.scheduledDate).toISOString().slice(0,10) === todayStr
        : false;
    } else if (filterDate) {
      dateMatch = v.timeIn
        ? new Date(v.timeIn).toISOString().slice(0,10) === filterDate
        : v.scheduledDate
        ? new Date(v.scheduledDate).toISOString().slice(0,10) === filterDate
        : false;
    }

    let statusMatch = true;
    if (statusFilter === "pending") statusMatch = !v.processingStartedTime && !v.processed;
    if (statusFilter === "processing") statusMatch = v.processingStartedTime && !v.processed;
    if (statusFilter === "processed") statusMatch = v.processed;
    if (statusFilter === "overdue") statusMatch = isOverdue(v);

    return searchMatch && dateMatch && statusMatch;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

  const today = new Date();
  const visitorsToday = visitors.filter(v => v.timeIn && new Date(v.timeIn).toDateString() === today.toDateString()).length;
  const processedCount = visitors.filter(v => v.processed).length;
  const processingCount = visitors.filter(v => v.processingStartedTime && !v.processed).length;
  const pendingCount = visitors.filter(v => !v.processingStartedTime && !v.processed).length;
  const overdueCount = visitors.filter(v => isOverdue(v)).length;

  const officeCounts = {};
  visitors.forEach(v => {
    if (v.office) officeCounts[v.office] = (officeCounts[v.office] || 0) + 1;
  });

  const barData = Object.entries(officeCounts).map(([office, count]) => ({ office, count }));
  const pieData = [
    { name: "Pending", value: pendingCount },
    { name: "Processing", value: processingCount },
    { name: "Processed", value: processedCount },
    { name: "Overdue", value: overdueCount }
  ];
  const COLORS = ["#FFBB28", "#0088FE", "#00C49F", "#FF0000"];

  const getStatusBg = (v) => isOverdue(v) ? "bg-red-100 hover:bg-red-200" : v.processed ? "bg-green-50 hover:bg-green-100" : v.processingStartedTime ? "bg-blue-50 hover:bg-blue-100" : "bg-yellow-50 hover:bg-yellow-100";
  const getStatusColor = (v) => isOverdue(v) ? "text-red-600 font-semibold" : v.processed ? "text-green-600 font-semibold" : v.processingStartedTime ? "text-blue-600 font-semibold" : "text-yellow-600 font-semibold";

  const handleEditVisitor = async (id, currentName) => {
    const newName = prompt("Edit name", currentName);
    if (!newName) return;
    try {
      const res = await fetch(`${API_BASE}/visitors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      });
      if (!res.ok) throw new Error("Failed to update visitor");
      const updatedVisitor = await res.json();
      setVisitors(visitors.map(v => v._id === id ? updatedVisitor : v));
    } catch (err) {
      console.error(err);
      alert("Failed to update visitor");
    }
  };

  const handleDeleteVisitor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this visitor?")) return;
    try {
      const res = await fetch(`${API_BASE}/visitors/${id}`, { method: "DELETE" });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) throw new Error(`Expected JSON but got: ${contentType || "unknown"}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete visitor");
      setVisitors(prev => prev.filter(v => v._id !== id));
      alert("Visitor deleted successfully");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const exportCSV = () => {
    const header = ["Visitor Name","Contact Number","Email","Office","Purpose","Scheduled Date","Scheduled Time","Date In","Time In","Time Out","Status","Feedback"];
const rows = visitors.map(v => [
  v.name, v.contactNumber, v.email || "-", v.office, v.purpose,
  v.scheduledDate ? formatDateMMDDYYYY(v.scheduledDate) : "",
  formatScheduledTime(v.scheduledTime),
  v.timeIn ? formatDateMMDDYY(v.timeIn) : "",
  v.timeIn ? formatTime12(v.timeIn) : "",
  v.timeOut ? formatTime12(v.timeOut) : "",
  isOverdue(v) ? "Overdue" : v.processed ? "Processed" : v.processingStartedTime ? "Processing" : "Pending",
  v.feedback || ""
]);

    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "visitor_logs.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button onClick={goToLogin} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition">
          Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow p-5 text-center">
          <p className="font-semibold">Visitors Today</p>
          <p className="text-3xl font-bold">{visitorsToday}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg shadow p-5 text-center">
          <p className="font-semibold">Pending</p>
          <p className="text-3xl font-bold">{pendingCount}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow p-5 text-center">
          <p className="font-semibold">Processing</p>
          <p className="text-3xl font-bold">{processingCount}</p>
        </div>
        <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg shadow p-5 text-center">
          <p className="font-semibold">Processed</p>
          <p className="text-3xl font-bold">{processedCount}</p>
        </div>
        <div className="bg-gradient-to-r from-red-400 to-red-600 text-white rounded-lg shadow p-5 text-center">
          <p className="font-semibold">Overdue</p>
          <p className="text-3xl font-bold">{overdueCount}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition">
          <h2 className="text-gray-700 font-semibold mb-2">Visitors per Office</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="office" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="url(#barGradient)" />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition">
          <h2 className="text-gray-700 font-semibold mb-2">Visitor Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters & Export */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        <input
          type="text"
          placeholder="Search by Name, Contact Number, Office, Purpose"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border p-2 rounded w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} />
          Today Only
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="processed">Processed</option>
          <option value="overdue">Overdue</option>
        </select>
        <button
          onClick={exportCSV}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full md:w-auto transition"
        >
          Export CSV
        </button>
      </div>

      {/* Visitors Table */}
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="w-full text-center">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Contact Number</th>
              <th className="p-3">Email</th>
              <th className="p-3">Office</th>
              <th className="p-3">Purpose</th>
              <th className="p-3">Scheduled Date</th>
              <th className="p-3">Scheduled Time</th>
              <th className="p-3">Date In</th>
              <th className="p-3">Time In</th>
              <th className="p-3">Time Out</th>
              <th className="p-3">Status</th>
              <th className="p-3">ID</th>
              <th className="p-3">Feedback</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentVisitors.map(v => (
              <tr key={v._id} className={`${getStatusBg(v)} transition`}>
                <td className="p-2">{highlightText(v.name)}</td>
                <td className="p-2">{highlightText(v.contactNumber)}</td>
                <td className="p-2">{highlightText(v.email || "-")}</td>
                <td className="p-2">{highlightText(v.office)}</td>
                <td className="p-2">{highlightText(v.purpose)}</td>
                <td className="p-2">{formatDateMMDDYYYY(v.scheduledDate)}</td>
                <td className="p-2 font-semibold">{formatScheduledTime(v.scheduledTime)}</td>
                <td className="p-2">{formatDateMMDDYY(v.timeIn)}</td>
                <td className="p-2">{formatTime12(v.timeIn)}</td>
                <td className="p-2">{formatTime12(v.timeOut)}</td>
                <td className={`p-2 ${getStatusColor(v)}`}>
                  {isOverdue(v) ? "Overdue" : v.processed ? "Processed" : v.processingStartedTime ? "Processing" : "Pending"}
                </td>
                <td className="p-2">
                  {v.idFile ? (
                    <img
                      src={v.idFile}
                      alt="ID"
                      className="w-16 h-16 object-contain cursor-pointer rounded hover:scale-105 transition"
                      onClick={() => { setModalImage(v.idFile); setModalName(v.name); setModalOpen(true); }}
                    />
                  ) : "-"}
                </td>
                <td className="p-2">
                  {v.feedback ? (
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => {
                        setFeedbackText(v.feedback);
                        setFeedbackVisitorName(v.name);
                        setFeedbackModalOpen(true);
                      }}
                    >
                      📝
                    </button>
                  ) : "-"}
                </td>
                <td className="p-2 flex gap-2 justify-center">
                  <button
                    onClick={() => handleEditVisitor(v._id, v.name)}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVisitor(v._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          disabled={currentPage === 1}
        >
          Prev
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      <IDPreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage}
        visitorName={modalName}
      />

      {/* Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
            <h2 className="text-lg font-semibold mb-4">{feedbackVisitorName}'s Feedback</h2>
            <p className="mb-4 whitespace-pre-wrap">{feedbackText}</p>
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              onClick={() => setFeedbackModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
