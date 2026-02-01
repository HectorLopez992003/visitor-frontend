import React, { useState, useEffect, useRef } from "react";
  import { QRCodeCanvas } from "qrcode.react";
  import { Html5Qrcode } from "html5-qrcode";
  import IDPreviewModal from "../components/IDPreviewModal";
  import { API_BASE } from "../api";
  import * as faceapi from "face-api.js";

  const MainPage = ({ goToVisitorManagement, newVisitor }) => {
    const [visitorList, setVisitorList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [todayOnly, setTodayOnly] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const [modalName, setModalName] = useState("");
    const [scanning, setScanning] = useState(false);
    const [scannerInstance, setScannerInstance] = useState(null);
    const [lastScanTimes, setLastScanTimes] = useState({});
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [faceScanning, setFaceScanning] = useState(false);

    // --- Pagination states ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // visitors per page

    const scannerRef = useRef(null);

    const showToast = (message, type = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };

// --- Helper: trigger overdue email ---
const triggerOverdueEmail = async (visitorId) => {
  try {
    const res = await fetch(`${API_BASE}/visitors/${visitorId}/send-overdue-email`, {
      method: "POST",
    });
    const data = await res.json();
if (!data.success) throw new Error(data.message || "Failed to send overdue email");

setVisitorList(prev =>
  prev.map(v => (v._id === visitorId ? { ...v, overdueEmailSent: true } : v))
);
showToast(`📧 Overdue email sent to visitor`, "success");
  
  } catch (err) {
    console.error(err);
    showToast(`❌ Failed to send overdue email: ${err.message}`, "error");
  }
};

// --- Auto-detect overdue visitors & send email ---
useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();

    visitorList.forEach((v) => {
      if (
        v.officeProcessedTime &&
        !v.timeOut &&
        !v.overdueEmailSent // ensure we only send once
      ) {
        const processedTime = new Date(v.officeProcessedTime).getTime();
        if (now - processedTime > 30 * 60 * 1000) {
          // Show UI badge/toast
          showToast(`⚠️ ${v.name} exceeded 30 mins after office processing!`, "error");

          // Send email/SMS
          triggerOverdueEmail(v._id);
        }
      }
    });
  }, 60 * 1000); // check every 1 min

  return () => clearInterval(interval);
}, [visitorList]);

    // Load face-api models
    useEffect(() => {
      const loadModels = async () => {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("✅ Face-api models loaded");
      };
      loadModels();
    }, []);

    // Fetch visitors initially
    useEffect(() => {
      const fetchVisitors = async () => {
        try {
          const res = await fetch(`${API_BASE}/visitors`);
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to load visitors");
          }
          const data = await res.json();
          setVisitorList(data);
        } catch (err) {
          console.error("Failed to load visitors:", err);
          if (visitorList.length === 0)
            showToast("Failed to load visitors from backend", "error");
        } finally {
          setLoading(false);
        }
      };
      fetchVisitors();
    }, []);

    // Add new visitor in real-time
    useEffect(() => {
      if (newVisitor) {
        setVisitorList((prev) => [newVisitor, ...prev]);
      }
    }, [newVisitor]);

    // Polling to auto-update visitors
  useEffect(() => {
    let intervalId;
    let isMounted = true; // to prevent state updates if component unmounts

    const fetchVisitorsSafe = async () => {
      if (!navigator.onLine) {
        console.warn("Offline, skipping visitor fetch...");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/visitors`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch visitors");
        }
        const data = await res.json();

        if (!isMounted) return; // avoid setting state after unmount
        setVisitorList(prevList => {
          const existingIds = new Set(prevList.map(v => v._id));
          const newVisitors = data.filter(v => !existingIds.has(v._id));
          if (newVisitors.length > 0) return [...newVisitors, ...prevList];
          return prevList;
        });
      } catch (err) {
        console.warn("Visitor fetch failed, will retry:", err.message);
        // no toast here to avoid spamming
      }
    };

    // Initial fetch
    fetchVisitorsSafe();

    // Polling every 10s
    intervalId = setInterval(fetchVisitorsSafe, 10000);

    return () => {
      isMounted = false; // prevent state updates after unmount
      clearInterval(intervalId);
    };
  }, []);

    // Helper functions
    const highlightMatch = (text) => {
      if (!text) return "-";
      if (!searchTerm) return text;
      const regex = new RegExp(`(${searchTerm})`, "gi");
      return text.split(regex).map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-yellow-200 font-bold">
            {part}
          </span>
        ) : (
          <span key={index} className="font-semibold">
            {part}
          </span>
        )
      );
    };

    const formatTime = (value) => {
      if (!value) return "-";
      if (!isNaN(new Date(value))) {
        return new Date(value).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
      if (typeof value === "string" && value.includes(":")) {
        const [hour, minute] = value.split(":").map(Number);
        const d = new Date();
        d.setHours(hour, minute, 0, 0);
        return d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
      return "-";
    };

    const formatDateMMDDYYYY = (datetime) => {
      if (!datetime) return "-";
      const d = new Date(datetime);
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
        d.getDate()
      ).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const getStatusStyle = (v) => {
      if (v.processed) return { text: "text-green-800 font-bold", bg: "bg-green-50" };
      if (v.processingStartedTime)
        return { text: "text-blue-800 font-bold", bg: "bg-blue-50" };
      return { text: "text-yellow-800 font-bold", bg: "bg-yellow-50" };
    };

    const isOverdue = (v) => {
      if (v.officeProcessedTime && !v.timeOut) {
        const now = Date.now();
        const processedTime = new Date(v.officeProcessedTime).getTime();
        return now - processedTime > 30 * 60 * 1000;
      }
      return false;
    };

  const filteredVisitors = visitorList.filter((v) => {
    const matchesSearch =
      (v.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (v.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (v.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false); // ✅ added email

      let matchesDate = true;
      if (todayOnly) {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        matchesDate = v.timeIn
          ? new Date(v.timeIn).toISOString().slice(0, 10) === todayStr
          : v.scheduledDate
          ? new Date(v.scheduledDate).toISOString().slice(0, 10) === todayStr
          : false;
      } else if (filterDate) {
        matchesDate = v.timeIn
          ? new Date(v.timeIn).toISOString().slice(0, 10) === filterDate
          : v.scheduledDate
          ? new Date(v.scheduledDate).toISOString().slice(0, 10) === filterDate
          : false;
      }

      let matchesStatus = true;
      if (statusFilter === "pending") matchesStatus = !v.processingStartedTime && !v.processed;
      if (statusFilter === "processing") matchesStatus = v.processingStartedTime && !v.processed;
      if (statusFilter === "processed") matchesStatus = v.processed;
      if (statusFilter === "overdue") matchesStatus = isOverdue(v);

      return matchesSearch && matchesDate && matchesStatus;
    });

    // --- PAGINATION ---
    const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
    const paginatedVisitors = filteredVisitors.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

// --- FACE VERIFICATION FUNCTION ---
const verifyFaceWithID = async (visitor) => {
  // BLOCK non-accepted visitors
  if (visitor.accepted !== true) {
    const status = visitor.accepted === false ? "declined" : "pending approval";
    showToast(`${visitor.name} is ${status} and cannot use Face/QR features!`, "error");
    return false;
  }

  if (!visitor.idFile) {
    showToast("No ID uploaded for this visitor", "error");
    return false;
  }

  setFaceScanning(true);

  try {
    const idImage = await faceapi.fetchImage(visitor.idFile);
    const idResult = await faceapi
      .detectSingleFace(idImage, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!idResult) {
      showToast("No face detected on ID", "error");
      setFaceScanning(false);
      return false;
    }

    // Show live video
    const video = document.createElement("video");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    document.body.appendChild(video);
    video.style.position = "fixed";
    video.style.top = "50%";
    video.style.left = "50%";
    video.style.transform = "translate(-50%, -50%)";
    video.style.width = "320px";
    video.style.height = "240px";
    video.style.zIndex = 9999;
    video.style.border = "2px solid white";
    video.style.borderRadius = "8px";

    await video.play();

    const startTime = Date.now();
    let matched = false;

    while (Date.now() - startTime < 15000) {
      const liveResult = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (liveResult) {
        const distance = faceapi.euclideanDistance(idResult.descriptor, liveResult.descriptor);
        if (distance < 0.6) {
          matched = true;
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 400));
    }

    stream.getTracks().forEach((t) => t.stop());
    video.remove();
    setFaceScanning(false);

    if (!matched) {
      showToast("Face does not match the ID", "error");
      return false;
    }

    return true;
  } catch (err) {
    console.error(err);
    setFaceScanning(false);
    showToast("Face verification failed", "error");
    return false;
  }
};

    // --- TIME IN & TIME OUT ---
const handleTimeIn = async (id) => {
  const visitor = visitorList.find((v) => v._id === id);
  if (!visitor) return;

  // BLOCK non-accepted visitors
  if (visitor.accepted !== true) {
    const status = visitor.accepted === false ? "declined" : "pending approval";
    showToast(`${visitor.name} is ${status} and cannot Time In!`, "error");
    return;
  }

  const faceOK = await verifyFaceWithID(visitor);
  if (!faceOK) return;

      const visitorName = visitor.name || "Visitor";

      try {
        const res = await fetch(`${API_BASE}/visitors/${id}/time-in`, { method: "PUT" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to Time In");

        setVisitorList((prev) =>
          prev.map((v) => (v._id === id ? { ...v, timeIn: data.timeIn } : v))
        );

        showToast(`✅ ${visitorName} successfully timed in`, "success");
      } catch (err) {
        console.error(err);
        showToast(`❌ Failed to time in ${visitorName}`, "error");
      }
    };

const handleTimeOut = async (id) => {
  const visitor = visitorList.find((v) => v._id === id);
  const visitorName = visitor?.name || "Visitor";

  // BLOCK non-accepted visitors
  if (visitor?.accepted !== true) {
    const status = visitor?.accepted === false ? "declined" : "pending approval";
    showToast(`${visitorName} is ${status} and cannot Time Out!`, "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/visitors/${id}/time-out`, { method: "PUT" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to Time Out");

    setVisitorList((prev) =>
      prev.map((v) => (v._id === id ? { ...v, timeOut: data.timeOut } : v))
    );

    showToast(`✅ ${visitorName} successfully timed out`, "success");
  } catch (err) {
    console.error(err);
    showToast(`❌ Failed to time out ${visitorName}`, "error");
  }
};

    // --- QR Scanner ---
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

        html5QrCode
          .start(
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
                visitorData = { contactNumber: decodedText };
              }
             const visitor = visitorList.find(
  (v) => v.contactNumber === visitorData.contactNumber
);

if (!visitor) {
  showToast("QR does not match any visitor!", "error");
  return;
}

// BLOCK declined visitors
if (visitor.accepted === false) {
  showToast(`${visitor.name} was declined and cannot use QR/Face features!`, "error");
  html5QrCode.stop().finally(() => {
    setScanning(false);
    setScannerInstance(null);
  });
  return;
}

              const now = Date.now();
              const lastScan = lastScanTimes[visitor.contactNumber] || 0;
              if (now - lastScan < 2000) return;
              setLastScanTimes({ ...lastScanTimes, [visitor.contactNumber]: now });

              if (!visitor.timeIn) {
                handleTimeIn(visitor._id);
              } else if (!visitor.timeOut) {
                handleTimeOut(visitor._id);
              } else {
                showToast(
                  `${visitor.name} has already completed Time In & Time Out.`,
                  "info"
                );
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
          )
          .catch((err) => {
            console.error("Unable to start QR scan:", err);
            setScanning(false);
          });
      }
    }, [scanning]);

    if (loading)
      return (
        <div className="text-center mt-20 font-bold text-gray-700">
          Loading visitors...
        </div>
      );

    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen relative">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-6 right-6 px-4 py-2 rounded shadow text-white font-semibold ${
              toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                ? "bg-red-600"
                : "bg-blue-600"
            } z-50`}
          >
            {toast.message}
          </div>
        )}

        {/* Face scanning overlay */}
        {faceScanning && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow text-center font-bold">
              📷 Scanning face… please look at the camera
            </div>
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
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Guard - Visitor Log
        </h1>

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
            placeholder="Search by Name or Contact Number..."
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={todayOnly}
              onChange={(e) => setTodayOnly(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            Today Only
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 border p-2 rounded shadow font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="processed">Processed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Visitors grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedVisitors.map((v, i) => {
            const statusStyle = getStatusStyle(v);
            const qrValue =
    v.name && v.contactNumber
      ? JSON.stringify({ contactNumber: v.contactNumber, name: v.name }) 
      : "";

            return (
              <div
                key={v._id || i}
                className={`rounded-lg shadow-lg p-4 flex flex-col gap-2 
                  ${isOverdue(v) ? "bg-red-50" : statusStyle.bg} 
                  transition transform hover:-translate-y-1 hover:shadow-2xl`}
              >
                {/* Visitor details, QR, buttons remain unchanged */}
                <div className="space-y-1">
{/* ----- ACCEPTED / DECLINED BADGE ----- */}
<span
  className={`px-2 py-1 rounded-full text-xs font-bold mb-1 inline-block text-center ${
    v.accepted === true
      ? "bg-green-200 text-green-800"
      : v.accepted === false
      ? "bg-red-200 text-red-800"
      : "bg-gray-200 text-gray-800"
  }`}
  style={{ minWidth: "350px" }} // ✅ fixed width
>
  {v.accepted === true
    ? "Accepted ✅"
    : v.accepted === false
    ? "Declined ❌"
    : "Pending ⏳"}
</span>
    <h2 className="text-xl font-bold text-black">{highlightMatch(v.name)}</h2>
    <p className="text-gray-800 font-semibold">{highlightMatch(v.contactNumber)}</p>
    <p className="text-gray-800 font-semibold">
    <span className="font-bold">Email:</span> {highlightMatch(v.email || "-")}</p>
    <p className="text-gray-800 font-semibold">
      <span className="font-bold">Office:</span> {highlightMatch(v.office)}
    </p>
    <p className="text-gray-800 font-semibold">
      <span className="font-bold">Purpose:</span> {highlightMatch(v.purpose)}
    </p>
    <p className="text-gray-800 font-semibold">
      <span className="font-bold">Scheduled Date:</span>{" "}
      {v.scheduledDate ? formatDateMMDDYYYY(v.scheduledDate) : "-"}
    </p>
    <p className="text-gray-800 font-semibold">
      <span className="font-bold">Scheduled Time:</span>{" "}
      {v.scheduledTime ? formatTime(v.scheduledTime) : "-"}
    </p>
    <p className="text-gray-800 font-semibold">
      <span className="font-bold">Date In:</span>{" "}
      {v.timeIn ? formatDateMMDDYYYY(v.timeIn) : "-"}
    </p>
    <p className="text-gray-800 font-semibold">
      <span className="font-bold">Processing Started:</span>{" "}
      {formatTime(v.processingStartedTime)}
    </p>
    <p className="text-gray-800 font-semibold">
      <span className="font-bold">Office Processed:</span>{" "}
      {formatTime(v.officeProcessedTime)}
    </p>
    <p className={`${isOverdue(v) ? "text-red-800 font-bold" : statusStyle.text}`}>
      Status:{" "}
      {isOverdue(v)
        ? "Overdue"
        : v.processed
        ? "Processed"
        : v.processingStartedTime
        ? "Processing"
        : "Pending"}
    </p>

    {/* ✅ Email sent badge */}
    {v.overdueEmailSent && (
      <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded">
        Email sent
      </span>
    )}
  </div>

                {v.idFile && (
                  <div
                    className="relative w-full h-32 overflow-hidden rounded border cursor-pointer group"
                    onClick={() => {
                      setModalImage(v.idFile);
                      setModalName(v.name);
                      setModalOpen(true);
                    }}
                  >
                    <img
                      src={v.idFile}
                      alt="ID Preview"
                      className="w-full h-full object-contain transition group-hover:scale-105"
                    />
                  </div>
                )}

                {qrValue && (
                  <div className="flex flex-col items-center gap-2 mt-2">
                    <QRCodeCanvas
                      id={`qr-canvas-${i}`}
                      value={qrValue}
                      size={120}
                      level="L"
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
                        a.download = v.name
                          ? `${v.name.replace(/\s+/g, "_")}_qr.png`
                          : "visitor_qr.png";
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
                    className={`flex-1 px-3 py-1 rounded text-white transition ${
                      v.timeIn
                        ? "bg-green-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {v.timeIn ? formatTime(v.timeIn) : "Time In"}
                  </button>
                  <button
                    onClick={() => handleTimeOut(v._id)}
                    disabled={!v.timeIn || v.timeOut}
                    className={`flex-1 px-3 py-1 rounded text-white transition ${
                      v.timeOut
                        ? "bg-red-500 cursor-not-allowed"
                        : v.timeIn
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {v.timeOut ? formatTime(v.timeOut) : "Time Out"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination buttons */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
            >
              Next
            </button>
          </div>
        )}

        <IDPreviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          imageSrc={modalImage}
          visitorName={modalName}
        />
      </div>
    );
  };

  export default MainPage;
