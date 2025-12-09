import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";

const AdminPage = ({ visitors, updateVisitor, deleteVisitor, goToLogin }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Highlight matching text
  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="bg-yellow-300">{part}</span> : part
    );
  };

  // Filtered search
  const filteredVisitors = visitors.filter(v =>
    v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.visitorID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Stats calculations ---
  const today = new Date();
  const visitorsToday = visitors.filter(v =>
    v.timeIn && new Date(v.timeIn).toDateString() === today.toDateString()
  ).length;

  const processedCount = visitors.filter(v => v.processed).length;
  const processingCount = visitors.filter(
    v => v.processingStartedTime && !v.processed
  ).length;
  const pendingCount = visitors.filter(
    v => !v.processingStartedTime && !v.processed
  ).length;

  // Office visit counts
  const officeCounts = {};
  visitors.forEach(v => {
    if (v.office) officeCounts[v.office] = (officeCounts[v.office] || 0) + 1;
  });

  const barData = Object.entries(officeCounts).map(([office, count]) => ({
    office,
    count,
  }));

  // Pie chart data
  const pieData = [
    { name: "Pending", value: pendingCount },
    { name: "Processing", value: processingCount },
    { name: "Processed", value: processedCount },
  ];

  const COLORS = ["#FFBB28", "#0088FE", "#00C49F"];

  // CSV Export
  const exportCSV = () => {
    const header = ["Visitor Name", "ID", "Office", "Purpose", "Time In", "Time Out", "Status"];
    const rows = visitors.map(v => [
      v.visitorName,
      v.visitorID,
      v.office,
      v.purpose,
      v.timeIn || "",
      v.timeOut || "",
      v.processed ? "Processed"
        : v.processingStartedTime ? "Processing"
        : "Pending",
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + [header, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "visitor_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Row background color based on status
  const getRowColor = (v) => {
    if (v.processed) return "bg-green-100";
    if (v.processingStartedTime && !v.processed) return "bg-blue-100";
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={goToLogin}
          className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
        >
          Logout
        </button>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded shadow text-center">
          <h2 className="font-semibold">Visitors Today</h2>
          <p className="text-2xl font-bold">{visitorsToday}</p>
        </div>

        <div className="bg-green-100 p-4 rounded shadow text-center">
          <h2 className="font-semibold">Status Summary</h2>
          <p className="font-bold text-lg">🟡 {pendingCount} Pending</p>
          <p className="font-bold text-lg">🔵 {processingCount} Processing</p>
          <p className="font-bold text-lg">🟢 {processedCount} Processed</p>
        </div>

        <div className="bg-yellow-100 p-4 rounded shadow text-center">
          <h2 className="font-semibold">Most Visited Offices</h2>
          {Object.entries(officeCounts).map(([office, count]) => (
            <p key={office}>{office}: {count}</p>
          ))}
        </div>
      </div>

      {/* --- Charts --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Visitors per Office</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="office" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Visitor Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- Search & Export --- */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by Name, ID, Office, Purpose"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Export CSV
        </button>
      </div>

      {/* --- Visitor Table --- */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">ID</th>
              <th className="border p-2">Office</th>
              <th className="border p-2">Purpose</th>
              <th className="border p-2">Time In</th>
              <th className="border p-2">Time Out</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisitors.map((v, index) => {
              const rowColor = getRowColor(v);
              const statusColor = v.processed
                ? "text-green-600 font-semibold"
                : v.processingStartedTime
                ? "text-blue-600 font-semibold"
                : "";

              return (
                <tr key={index} className={rowColor}>
                  <td className="border p-2">{highlightText(v.visitorName)}</td>
                  <td className="border p-2">{highlightText(v.visitorID)}</td>
                  <td className="border p-2">{highlightText(v.office)}</td>
                  <td className="border p-2">{highlightText(v.purpose)}</td>
                  <td className="border p-2">{v.timeIn || "-"}</td>
                  <td className="border p-2">{v.timeOut || "-"}</td>
                  <td className={`border p-2 ${statusColor}`}>
                    {v.processed
                      ? "Processed"
                      : v.processingStartedTime
                      ? "Processing"
                      : "Pending"}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => {
                        const newName = prompt("Enter new visitor name:", v.visitorName);
                        if (newName) updateVisitor(index, { visitorName: newName });
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 m-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteVisitor(index)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 m-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Admin Settings Placeholder --- */}
      <div className="mt-8 p-4 bg-gray-100 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Admin Settings (Future)</h2>
        <p>Change admin credentials, roles, themes, etc.</p>
      </div>
    </div>
  );
};

export default AdminPage;
