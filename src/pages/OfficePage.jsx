import React, { useState, useEffect, useRef } from "react";
import IDPreviewModal from "../components/IDPreviewModal";
import { Html5Qrcode } from "html5-qrcode";

const OfficePage = ({ visitors, startProcessing, markProcessed, goToLogin }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
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
  const scannerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const highlightMatch = (text) => {
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

  const getStatusBadge = (v) => {
    if (v.processed)
      return <span className="px-2 py-1 rounded-full bg-green-300 text-green-900 font-bold text-sm">Processed</span>;
    if (v.processingStartedTime)
      return <span className="px-2 py-1 rounded-full bg-blue-300 text-blue-900 font-bold text-sm">Processing</span>;
    return <span className="px-2 py-1 rounded-full bg-yellow-300 text-yellow-900 font-bold text-sm">Pending</span>;
  };

  const getCardBackground = (v) => {
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

  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.visitorID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === "Pending") matchesStatus = !v.processingStartedTime && !v.processed;
    if (filterStatus === "Processing") matchesStatus = v.processingStartedTime && !v.processed;
    if (filterStatus === "Processed") matchesStatus = v.processed;

    const matchesToday = showTodayOnly ? isToday(v.timeIn) : true;
    const matchesDate = filterDate
      ? v.timeIn
        ? new Date(v.timeIn).toISOString().slice(0, 10) === filterDate
        : v.scheduledDate
        ? new Date(v.scheduledDate).toISOString().slice(0, 10) === filterDate
        : false
      : true;

    return matchesSearch && matchesStatus && matchesToday && matchesDate;
  });

  // SCANNER FUNCTIONS
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
          try { visitorData = JSON.parse(decodedText); } catch { visitorData = { visitorID: decodedText }; }

          const visitor = visitors.find((v) => v.visitorID === visitorData.visitorID);
          if (!visitor) { showToast("QR does not match any visitor!", "error"); return; }

          const now = Date.now();
          const lastScan = lastScanTimes[visitor.visitorID] || 0;
          if (now - lastScan < 2000) return;
          setLastScanTimes({ ...lastScanTimes, [visitor.visitorID]: now });

          if (!visitor.processingStartedTime) {
            startProcessing(visitor._id);
            showToast(`✅ Processing Started: ${visitor.name}`);
          } else if (!visitor.processed) {
            markProcessed(visitor._id);
            showToast(`✅ Processed: ${visitor.name}`);
          } else {
            showToast(`${visitor.name} is already completed.`, "info");
          }

          html5QrCode.stop().finally(() => { setScanning(false); setScannerInstance(null); });
        },
        (error) => console.warn("QR Scan Error:", error)
      ).catch((err) => { console.error("Unable to start QR scan:", err); setScanning(false); });
    }
  }, [scanning]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen relative">
      {/* TOAST */}
      {toast && (
        <div className={`fixed top-6 right-6 px-4 py-2 rounded shadow text-white font-semibold ${toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"} z-50`}>
          {toast.message}
        </div>
      )}

      {/* SCANNER PANEL */}
      <div className="fixed top-24 right-6 z-40 w-60 flex flex-col items-center gap-2">
        <button
          onClick={startScanner}
          disabled={scanning}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-semibold text-sm w-full"
        >
          {scanning ? "Scanning..." : "Start Scanner"}
        </button>

        {scanning && (
          <>
            <button
              onClick={stopScanner}
              className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition font-semibold text-sm w-full"
            >
              Stop Scanner
            </button>

            <div
              ref={scannerRef}
              id="office-qr-reader"
              className="w-full h-56 overflow-hidden rounded border"
            />
            <style>{`
              #office-qr-reader video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
            `}</style>
          </>
        )}
      </div>

      {/* OFFICE PAGE UI */}
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Office Dashboard</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
        <button
          onClick={goToLogin}
          className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 font-semibold"
        >
          Logout
        </button>

        <input
          type="text"
          placeholder="Search by Name, ID, Office, or Purpose"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full md:w-64 font-semibold"
        />

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border p-2 rounded w-full md:w-48 font-semibold"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border p-2 rounded w-full md:w-48 font-semibold"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Processed">Processed</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer font-semibold">
          <input
            type="checkbox"
            checked={showTodayOnly}
            onChange={() => setShowTodayOnly(!showTodayOnly)}
            className="w-4 h-4 accent-blue-500"
          />
          Today Only
        </label>
      </div>

      {/* VISITOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVisitors.map((v) => (
          <div key={v._id} className={`rounded-lg shadow-lg p-4 flex flex-col gap-2 border ${getCardBackground(v)} transition transform hover:-translate-y-1 hover:shadow-2xl`}>
            <h2 className="text-xl font-bold text-black">{highlightMatch(v.name)}</h2>
            <p className="text-gray-800 font-semibold">{highlightMatch(v.visitorID)}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Office:</span> {highlightMatch(v.office)}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Purpose:</span> {highlightMatch(v.purpose)}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Scheduled Date:</span> {v.scheduledDate ? formatDateMMDDYYYY(v.scheduledDate) : "-"}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Scheduled Time:</span> {v.scheduledTime ? formatTime(v.scheduledTime) : "-"}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Date In:</span> {v.timeIn ? formatDateMMDDYYYY(v.timeIn) : "-"}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Processing Started:</span> {formatTime(v.processingStartedTime)}</p>
            <p className="text-gray-800 font-semibold"><span className="font-bold">Office Processed:</span> {formatTime(v.officeProcessedTime)}</p>
            <div className="my-3">{getStatusBadge(v)}</div>

            {v.idFile && (
              <div className="relative w-full h-32 overflow-hidden rounded border cursor-pointer group"
                onClick={() => { setModalImage(v.idFile); setModalName(v.name); setModalOpen(true); }}
              >
                <img src={v.idFile} alt="ID" className="w-full h-full object-contain transition group-hover:scale-105"/>
              </div>
            )}

            {!v.processingStartedTime && !v.processed ? (
              <button onClick={() => startProcessing(v._id)} className="bg-blue-600 text-white px-3 py-1 rounded w-full font-bold mt-3">
                Start Processing
              </button>
            ) : !v.processed ? (
              <button onClick={() => markProcessed(v._id)} className="bg-green-600 text-white px-3 py-1 rounded w-full font-bold mt-3">
                Done Processing
              </button>
            ) : (
              <p className="text-center font-bold mt-3">Completed</p>
            )}
          </div>
        ))}
      </div>

      <IDPreviewModal isOpen={modalOpen} onClose={() => setModalOpen(false)} imageSrc={modalImage} visitorName={modalName} />
    </div>
  );
};

export default OfficePage;
