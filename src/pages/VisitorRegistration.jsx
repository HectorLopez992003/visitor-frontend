import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

const VisitorRegistration = ({ addVisitor }) => {
  const [visitorName, setVisitorName] = useState("");
  const [visitorID, setVisitorID] = useState("");
  const [office, setOffice] = useState("");
  const [purpose, setPurpose] = useState("");
  const [qrData, setQrData] = useState("");
  const canvasRef = useRef(null);

  const handleGenerateQR = () => {
    if (!visitorName || !visitorID || !office || !purpose) {
      alert("Please fill in all fields.");
      return;
    }

    const payload = {
      visitorName,
      visitorID,
      office,
      purpose,
      generatedAt: new Date().toISOString(),
      timeIn: null,
      timeOut: null,
      qrData: "", // will be filled after generation
    };

    const qrJson = JSON.stringify(payload);
    setQrData(qrJson);
    payload.qrData = qrJson;

    if (addVisitor) addVisitor(payload);

    setTimeout(() => {
      const canvas = document.getElementById("qr-canvas");
      if (canvas) canvasRef.current = canvas;
    }, 50);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current || document.getElementById("qr-canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = visitorName
      ? `${visitorName.replace(/\s+/g, "_")}_qr.png`
      : "visitor_qr.png";
    a.click();
  };

  const handleClear = () => {
    setVisitorName("");
    setVisitorID("");
    setOffice("");
    setPurpose("");
    setQrData("");
    canvasRef.current = null;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">Visitor Registration</h1>

      <div className="grid gap-3">
        <input
          type="text"
          placeholder="Visitor Name"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Visitor ID"
          value={visitorID}
          onChange={(e) => setVisitorID(e.target.value)}
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Office to Visit"
          value={office}
          onChange={(e) => setOffice(e.target.value)}
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleGenerateQR}
            className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Generate QR Code
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-200 text-gray-800 p-2 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {qrData && (
        <div className="mt-6 text-center">
          <h2 className="font-semibold mb-2">Your QR Code</h2>
          <div className="inline-block bg-white p-4 rounded shadow">
            <QRCodeCanvas
              id="qr-canvas"
              value={qrData}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="mt-3 space-x-2">
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorRegistration;
