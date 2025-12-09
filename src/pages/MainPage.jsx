import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const MainPage = ({ visitors, handleTimeIn, handleTimeOut, goToVisitorManagement }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVisitors = visitors.filter(
    (v) =>
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.visitorID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highlightMatch = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <span key={index} className="bg-yellow-300">{part}</span> : <span key={index}>{part}</span>
    );
  };

  const getRowClass = (v) => {
    if (v.processed) return "bg-green-50";
    if (v.processingStartedTime) return "bg-blue-50";
    return "";
  };

  const formatTime = (datetime) => (datetime ? new Date(datetime).toLocaleTimeString() : "-");
  const formatDate = (datetime) => (datetime ? new Date(datetime).toLocaleDateString() : "-");

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Guard - Visitor Log</h1>

      {goToVisitorManagement && (
        <div className="mb-6 text-left">
          <button
            onClick={goToVisitorManagement}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Visitor Registration
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by Name or ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="overflow-x-auto border rounded shadow-sm">
        <table className="min-w-full border-collapse border border-gray-300 text-center">
          <thead className="bg-gray-200 sticky top-0">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">ID</th>
              <th className="border p-2">Office</th>
              <th className="border p-2">Purpose</th>
              <th className="border p-2">Date</th> {/* New Date column */}
              <th className="border p-2">Processing Started</th>
              <th className="border p-2">Office Processed</th>
              <th className="border p-2">Processed Status</th>
              <th className="border p-2">QR Code</th>
              <th className="border p-2">Time In</th>
              <th className="border p-2">Time Out</th>
            </tr>
          </thead>

          <tbody className="text-center">
            {filteredVisitors.map((v, i) => (
              <tr key={i} className={`${getRowClass(v)} hover:bg-gray-50`}>
                <td className="border p-2">{highlightMatch(v.visitorName)}</td>
                <td className="border p-2">{highlightMatch(v.visitorID)}</td>
                <td className="border p-2">{highlightMatch(v.office)}</td>
                <td className="border p-2">{highlightMatch(v.purpose)}</td>

                {/* Single date column */}
                <td className="border p-2">{formatDate(v.timeIn)}</td>

                <td className="border p-2">{formatTime(v.processingStartedTime)}</td>
                <td className="border p-2">{formatTime(v.officeProcessedTime)}</td>
                <td className="border p-2">
                  {v.processed ? (
                    <span className="text-green-600 font-semibold">Processed</span>
                  ) : v.processingStartedTime ? (
                    <span className="text-blue-600 font-semibold">Processing</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Pending</span>
                  )}
                </td>

                {/* QR Code */}
                <td className="border p-2">
                  {v.qrData && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="inline-block transition-transform duration-200 hover:scale-150">
                        <QRCodeCanvas
                          id={`qr-canvas-${i}`}
                          value={v.qrData}
                          size={160}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const canvas = document.getElementById(`qr-canvas-${i}`);
                          if (!canvas) return;
                          const url = canvas.toDataURL("image/png");
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = v.visitorName
                            ? `${v.visitorName.replace(/\s+/g, "_")}_qr.png`
                            : "visitor_qr.png";
                          a.click();
                        }}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
                      >
                        Download QR
                      </button>
                    </div>
                  )}
                </td>

                {/* Time In */}
                <td className="border p-2">
                  {v.timeIn ? (
                    <span className="text-green-600 font-semibold">{formatTime(v.timeIn)}</span>
                  ) : (
                    <button
                      onClick={() => handleTimeIn(i)}
                      className="w-full px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                    >
                      Time In
                    </button>
                  )}
                </td>

                {/* Time Out */}
                <td className="border p-2">
                  {v.timeOut ? (
                    <span className="text-red-600 font-semibold">{formatTime(v.timeOut)}</span>
                  ) : (
                    <button
                      onClick={() => handleTimeOut(i)}
                      disabled={!v.timeIn}
                      className={`w-full px-3 py-1 rounded text-white ${
                        v.timeIn ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Time Out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MainPage;
