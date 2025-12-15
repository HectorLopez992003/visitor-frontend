import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";
import IDPreviewModal from "../components/IDPreviewModal";

const AdminPage = ({ visitors, updateVisitor, deleteVisitor, goToLogin }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [modalName, setModalName] = useState("");

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="bg-yellow-300">{part}</span> : part
    );
  };

  /* ========== DATE & TIME FORMATTERS ========== */
  const formatDateMMDDYYYY = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleDateString("en-US");
  };

  const formatDateMMDDYY = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  const formatTime12 = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

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

  /* ========== FILTER VISITORS ========== */
  const filteredVisitors = visitors.filter(v => {
    const searchMatch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.visitorID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const dateMatch = filterDate
      ? v.timeIn
        ? new Date(v.timeIn).toISOString().slice(0, 10) === filterDate
        : v.scheduledDate
          ? new Date(v.scheduledDate).toISOString().slice(0, 10) === filterDate
          : false
      : true;

    return searchMatch && dateMatch;
  });

  /* ========== DASHBOARD SUMMARY ========== */
  const today = new Date();
  const visitorsToday = visitors.filter(v =>
    v.timeIn && new Date(v.timeIn).toDateString() === today.toDateString()
  ).length;

  const processedCount = visitors.filter(v => v.processed).length;
  const processingCount = visitors.filter(v => v.processingStartedTime && !v.processed).length;
  const pendingCount = visitors.filter(v => !v.processingStartedTime && !v.processed).length;

  const officeCounts = {};
  visitors.forEach(v => {
    if (v.office) officeCounts[v.office] = (officeCounts[v.office] || 0) + 1;
  });

  const barData = Object.entries(officeCounts).map(([office, count]) => ({ office, count }));
  const pieData = [
    { name: "Pending", value: pendingCount },
    { name: "Processing", value: processingCount },
    { name: "Processed", value: processedCount },
  ];
  const COLORS = ["#FFBB28", "#0088FE", "#00C49F"];

  /* ========== CSV EXPORT ========== */
  const exportCSV = () => {
    const header = [
      "Visitor Name","ID","Office","Purpose",
      "Scheduled Date","Scheduled Time",
      "Date In","Time In","Time Out","Status"
    ];

    const rows = visitors.map(v => [
      v.name,
      v.visitorID,
      v.office,
      v.purpose,
      v.scheduledDate ? formatDateMMDDYYYY(v.scheduledDate) : "",
      formatScheduledTime(v.scheduledTime),
      v.timeIn ? formatDateMMDDYY(v.timeIn) : "",
      v.timeIn ? formatTime12(v.timeIn) : "",
      v.timeOut ? formatTime12(v.timeOut) : "",
      v.processed ? "Processed" : v.processingStartedTime ? "Processing" : "Pending"
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "visitor_logs.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBg = (v) => {
    if (v.processed) return "bg-green-50 hover:bg-green-100";
    if (v.processingStartedTime) return "bg-blue-50 hover:bg-blue-100";
    return "bg-yellow-50 hover:bg-yellow-100";
  };

  const getStatusColor = (v) => {
    if (v.processed) return "text-green-600 font-semibold";
    if (v.processingStartedTime) return "text-blue-600 font-semibold";
    return "text-yellow-600 font-semibold";
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow p-5 hover:shadow-xl transition text-center">
          <p className="font-semibold">Visitors Today</p>
          <p className="text-3xl font-bold">{visitorsToday}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg shadow p-5 hover:shadow-xl transition text-center">
          <p className="font-semibold">Status Summary</p>
          <p className="font-bold">🟡 {pendingCount} Pending</p>
          <p className="font-bold">🔵 {processingCount} Processing</p>
          <p className="font-bold">🟢 {processedCount} Processed</p>
        </div>
        <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg shadow p-5 hover:shadow-xl transition text-center">
          <p className="font-semibold">Most Visited Offices</p>
          {Object.entries(officeCounts).map(([office, count]) => (
            <p key={office}>{office}: {count}</p>
          ))}
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
          placeholder="Search by Name, ID, Office, Purpose"
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
              <th className="p-3">ID</th>
              <th className="p-3">Office</th>
              <th className="p-3">Purpose</th>
              <th className="p-3">Scheduled Date</th>
              <th className="p-3">Scheduled Time</th>
              <th className="p-3">Date In</th>
              <th className="p-3">Time In</th>
              <th className="p-3">Time Out</th>
              <th className="p-3">Status</th>
              <th className="p-3">ID</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisitors.map(v => (
              <tr key={v._id} className={`${getStatusBg(v)} transition`}>
                <td className="p-2">{highlightText(v.name)}</td>
                <td className="p-2">{highlightText(v.visitorID)}</td>
                <td className="p-2">{highlightText(v.office)}</td>
                <td className="p-2">{highlightText(v.purpose)}</td>
                <td className="p-2">{formatDateMMDDYYYY(v.scheduledDate)}</td>
                <td className="p-2 font-semibold">{formatScheduledTime(v.scheduledTime)}</td>
                <td className="p-2">{formatDateMMDDYY(v.timeIn)}</td>
                <td className="p-2">{formatTime12(v.timeIn)}</td>
                <td className="p-2">{formatTime12(v.timeOut)}</td>
                <td className={`p-2 ${getStatusColor(v)}`}>
                  {v.processed ? "Processed" : v.processingStartedTime ? "Processing" : "Pending"}
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
                <td className="p-2 flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      const newName = prompt("Edit name", v.name);
                      if (newName) updateVisitor(v._id, { name: newName });
                    }}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteVisitor(v._id)}
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

      <IDPreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage}
        visitorName={modalName}
      />
    </div>
  );
};

export default AdminPage;
