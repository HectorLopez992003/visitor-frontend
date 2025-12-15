import React, { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import IDPreviewModal from "../components/IDPreviewModal";

const MainPage = ({ visitors, handleTimeIn, handleTimeOut, goToVisitorManagement }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [modalName, setModalName] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [lastScanTimes, setLastScanTimes] = useState({});
  const [toast, setToast] = useState(null);
  const scannerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const formatTime = (value) => {
    if (!value) return "-";
    if (!isNaN(new Date(value))) {
      return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
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
    return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;
  };

  const getStatusStyle = (v) => {
    if (v.processed) return { text: "text-green-800 font-bold", bg: "bg-green-50" };
    if (v.processingStartedTime) return { text: "text-blue-800 font-bold", bg: "bg-blue-50" };
    return { text: "text-yellow-800 font-bold", bg: "bg-yellow-50" };
  };

  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch = (v.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                          (v.visitorID?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesDate = filterDate
      ? v.timeIn
        ? new Date(v.timeIn).toISOString().slice(0, 10) === filterDate
        : v.scheduledDate
        ? new Date(v.scheduledDate).toISOString().slice(0, 10) === filterDate
        : false
      : true;
    return matchesSearch && matchesDate;
  });

  const startScanner = () => {
    if (scanning) return;
    setScanning(true);
  };

  const stopScanner = () => {
    if (scannerInstance) {
      scannerInstance.stop().finally(() => {
        setScanning(false);
        setScannerInstance(null);
      });
    } else {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (scanning && scannerRef.current) {
      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      setScannerInstance(html5QrCode);

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 25,
          qrbox: { width: 300, height: 300 },
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          disableFlip: false,
          verbose: true,
        },
        (decodedText) => {
          let visitorData;
          try {
            visitorData = JSON.parse(decodedText);
          } catch {
            visitorData = { visitorID: decodedText };
          }

          const visitor = visitors.find((v) => v.visitorID === visitorData.visitorID);
          if (!visitor) {
            showToast("QR does not match any visitor!", "error");
            return;
          }

          const now = Date.now();
          const lastScan = lastScanTimes[visitor.visitorID] || 0;
          if (now - lastScan < 2000) return;
          setLastScanTimes({ ...lastScanTimes, [visitor.visitorID]: now });

          if (!visitor.timeIn) {
            handleTimeIn(visitor._id);
            showToast(`✅ Time In successful: ${visitor.name}`, "success");
          } else if (!visitor.timeOut) {
            handleTimeOut(visitor._id);
            showToast(`✅ Time Out successful: ${visitor.name}`, "success");
          } else {
            showToast(`${visitor.name} has already completed Time In & Time Out.`, "info");
            html5QrCode.stop().finally(() => {
              setScanning(false);
              setScannerInstance(null);
            });
            return;
          }

          html5QrCode.stop().finally(() => {
            setScanning(false);
            setScannerInstance(null);
          });
        },
        (error) => console.warn("QR Scan Error:", error)
      ).catch((err) => {
        console.error("Unable to start QR scan:", err);
        setScanning(false);
      });
    }
  }, [scanning]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 px-4 py-2 rounded shadow text-white font-semibold ${toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"} z-50`}>
          {toast.message}
        </div>
      )}

      {/* Scanner panel */}
      <div className="fixed top-24 right-6 z-40 w-64">
        <button
          onClick={startScanner}
          disabled={scanning}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-semibold mb-2 w-full"
        >
          {scanning ? "Scanning..." : "Start Scanner"}
        </button>

        {scanning && (
          <>
            <button
              onClick={stopScanner}
              className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition font-semibold mb-2 w-full"
            >
              Stop Scanner
            </button>
            <div
              ref={scannerRef}
              id="global-qr-reader"
              className="w-full h-64 overflow-hidden rounded"
              style={{ position: "relative" }}
            />
            <style>{`
              #global-qr-reader video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
            `}</style>
          </>
        )}
      </div>

      {/* Page content */}
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Guard - Visitor Log</h1>

      {goToVisitorManagement && (
        <div className="mb-6 text-left">
          <button
            onClick={goToVisitorManagement}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-semibold"
          >
            Go to Visitor Registration
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 border p-2 rounded shadow font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full md:w-48 border p-2 rounded shadow font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVisitors.map((v, i) => {
          const statusStyle = getStatusStyle(v);
          const qrValue = v.visitorID && v.name ? JSON.stringify({ visitorID: v.visitorID, name: v.name }).slice(0, 200) : "";

          return (
            <div
              key={v._id || i}
              className={`rounded-lg shadow-lg p-4 flex flex-col gap-2 border ${statusStyle.bg} transition transform hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-black">{highlightMatch(v.name)}</h2>
                <p className="text-gray-800 font-semibold">{highlightMatch(v.visitorID)}</p>
                <p className="text-gray-800 font-semibold"><span className="font-bold">Office:</span> {highlightMatch(v.office)}</p>
                <p className="text-gray-800 font-semibold"><span className="font-bold">Purpose:</span> {highlightMatch(v.purpose)}</p>
                <p className="text-gray-800 font-semibold"><span className="font-bold">Scheduled Date:</span> {v.scheduledDate ? formatDateMMDDYYYY(v.scheduledDate) : "-"}</p>
                <p className="text-gray-800 font-semibold"><span className="font-bold">Scheduled Time:</span> {v.scheduledTime ? formatTime(v.scheduledTime) : "-"}</p>
                <p className="text-gray-800 font-semibold"><span className="font-bold">Date In:</span> {v.timeIn ? formatDateMMDDYYYY(v.timeIn) : "-"}</p>
                <p className="text-gray-800 font-semibold"><span className="font-bold">Processing Started:</span> {formatTime(v.processingStartedTime)}</p>
                <p className="text-gray-800 font-semibold"><span className="font-bold">Office Processed:</span> {formatTime(v.officeProcessedTime)}</p>
                <p className={`${statusStyle.text}`}>Status: {v.processed ? "Processed" : v.processingStartedTime ? "Processing" : "Pending"}</p>
              </div>

              {v.idFile && (
                <div
                  className="relative w-full h-32 overflow-hidden rounded border cursor-pointer group"
                  onClick={() => { setModalImage(v.idFile); setModalName(v.name); setModalOpen(true); }}
                >
                  <img src={v.idFile} alt="ID Preview" className="w-full h-full object-contain transition group-hover:scale-105" />
                </div>
              )}

              {qrValue && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <QRCodeCanvas
                    id={`qr-canvas-${i}`}
                    value={qrValue}
                    size={120}
                    level="H"
                    includeMargin={true}
                    className="border p-1 rounded"
                  />
                  <button
                    onClick={() => {
                      const canvas = document.getElementById(`qr-canvas-${i}`);
                      if (!canvas) return;
                      const url = canvas.toDataURL("image/png");
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = v.name ? `${v.name.replace(/\s+/g, "_")}_qr.png` : "visitor_qr.png";
                      a.click();
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                  >
                    Download QR
                  </button>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleTimeIn(v._id)}
                  disabled={v.timeIn}
                  className={`flex-1 px-3 py-1 rounded text-white transition ${v.timeIn ? "bg-green-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {v.timeIn ? formatTime(v.timeIn) : "Time In"}
                </button>
                <button
                  onClick={() => handleTimeOut(v._id)}
                  disabled={!v.timeIn || v.timeOut}
                  className={`flex-1 px-3 py-1 rounded text-white transition ${v.timeOut ? "bg-red-500 cursor-not-allowed" : v.timeIn ? "bg-red-600 hover:bg-red-700" : "bg-gray-400 cursor-not-allowed"}`}
                >
                  {v.timeOut ? formatTime(v.timeOut) : "Time Out"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <IDPreviewModal isOpen={modalOpen} onClose={() => setModalOpen(false)} imageSrc={modalImage} visitorName={modalName} />
    </div>
  );
};

export default MainPage;
