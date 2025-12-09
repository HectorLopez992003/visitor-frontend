import React, { useState } from "react";

const OfficePage = ({ visitors, startProcessing, markProcessed, goToLogin }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVisitors = visitors
    .map((v, i) => ({ ...v, originalIndex: i }))
    .filter(
      (v) =>
        v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.visitorID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const highlightMatch = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <span key={index} className="bg-yellow-300">{part}</span> : <span key={index}>{part}</span>
    );
  };

  const getStatusClass = (v) => {
    if (v.processed) return "text-green-600 font-semibold";
    if (v.processingStartedTime) return "text-blue-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getStatusText = (v) => {
    if (v.processed) return "Processed";
    if (v.processingStartedTime) return "Processing";
    return "Pending";
  };

  const getRowClass = (v) => {
    if (v.processed) return "bg-green-50";
    if (v.processingStartedTime) return "bg-blue-50";
    return "";
  };

  const formatTime = (datetime) => {
    if (!datetime) return "-";
    return new Date(datetime).toLocaleTimeString();
  };

  const formatDate = (datetime) => {
    if (!datetime) return "-";
    return new Date(datetime).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">Office Page</h1>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToLogin}
          className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
        >
          Logout
        </button>
        <input
          type="text"
          placeholder="Search by Name, ID, Office, or Purpose"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {filteredVisitors.length === 0 ? (
        <p className="text-gray-500">No visitors match your search.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="border p-2">Name</th>
              <th className="border p-2">ID</th>
              <th className="border p-2">Office</th>
              <th className="border p-2">Purpose</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Time In</th>
              <th className="border p-2">Time Out</th>
              <th className="border p-2">Processing Started</th>
              <th className="border p-2">Office Processed Time</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredVisitors.map((v) => (
              <tr key={v.originalIndex} className={`text-center ${getRowClass(v)}`}>
                <td className="border p-2">{highlightMatch(v.visitorName)}</td>
                <td className="border p-2">{highlightMatch(v.visitorID)}</td>
                <td className="border p-2">{highlightMatch(v.office)}</td>
                <td className="border p-2">{highlightMatch(v.purpose)}</td>

                <td className="border p-2">{formatDate(v.timeIn)}</td>
                <td className="border p-2">{formatTime(v.timeIn)}</td>
                <td className="border p-2">{formatTime(v.timeOut)}</td>
                <td className="border p-2">{formatTime(v.processingStartedTime)}</td>
                <td className="border p-2">{formatTime(v.officeProcessedTime)}</td>
                <td className={`border p-2 ${getStatusClass(v)}`}>{getStatusText(v)}</td>

                {/* Actions column with larger buttons that wrap if needed */}
                <td className="border p-2 text-center">
                  {!v.processingStartedTime && !v.processed ? (
                    <button
                      onClick={() => startProcessing(v.originalIndex)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 w-full whitespace-normal break-words"
                    >
                      Start Processing
                    </button>
                  ) : !v.processed ? (
                    <button
                      onClick={() => markProcessed(v.originalIndex)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full whitespace-normal break-words"
                    >
                      Done Processing
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OfficePage;
