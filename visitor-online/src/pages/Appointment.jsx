import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { API_BASE } from "../api";

const VisitorRegistration = forwardRef(({ onNewAppointment, isAdmin = false }, ref) => {
  // --------------------
  // STATES
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("+639");
  const [email, setEmail] = useState("");
  const [office, setOffice] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const [savedQR, setSavedQR] = useState("");
  const [appointmentSaved, setAppointmentSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [toast, setToast] = useState(null);

const qrRef = useRef(null);
const offices = ["Registrar", "Guidance", "Cashier", "Dean", "Library"];

const navigate = useNavigate();

// ✅ VALIDATE REAL PH NUMBER
const isValidContactNumber = (num) => {
  return /^\+639\d{9}$/.test(num);
};

// ✅ CHECK IF FORM IS TRULY COMPLETE
const allFilled =
  name.trim() &&
  isValidContactNumber(contactNumber) &&
  email.trim() &&
  office &&
  purpose.trim() &&
  scheduledDate &&
  scheduledTime &&
  idFile;

  // --------------------
  // TOAST FUNCTION
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --------------------
  // FETCH PH HOLIDAYS
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = new Date().getFullYear();
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
        const data = await res.json();
        setHolidays(data.map(h => ({ date: h.date, name: h.localName })));
      } catch (err) {
        console.error("Failed to load holidays", err);
      }
    };
    fetchHolidays();
  }, []);

  // --------------------
  // FE-ONLY ANOMALY DETECTION (localStorage)
  const isDuplicateToday = (name, contactNumber) => {
    const today = new Date().toISOString().split("T")[0];
    const key = `visitor-${today}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return stored.some(v => v.name.toLowerCase() === name.toLowerCase() && v.contactNumber === contactNumber);
  };

  const saveVisitorToday = (name, contactNumber) => {
    const today = new Date().toISOString().split("T")[0];
    const key = `visitor-${today}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    stored.push({ name, contactNumber });
    localStorage.setItem(key, JSON.stringify(stored));
  };

  // --------------------
  // REFRESH APPOINTMENT
  const refreshAppointment = async () => {
    if (!contactNumber) return;
    try {
      const res = await fetch(`${API_BASE}/appointments/${contactNumber}`);
      if (!res.ok) throw new Error("Failed to fetch appointment");
      const { appointment } = await res.json();

      if (appointment.feedback) {
        setFeedback(appointment.feedback);
        setFeedbackSubmitted(true);
      }

      if (onNewAppointment) onNewAppointment(appointment);
    } catch (err) {
      console.error(err);
      showToast(`Error refreshing: ${err.message}`, "error");
    }
  };

  useImperativeHandle(ref, () => ({ refreshAppointment }));

  useEffect(() => {
    setFeedbackSubmitted(false);
    setFeedback("");
  }, [contactNumber]);

  // --------------------
  // DATE VALIDATION
  const isDisabledDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = date.getDay(); // 0=Sun,6=Sat
    if (date < today) return true;
    if (day === 0 || day === 6) return true;
    if (holidays.some(h => h.date === dateStr)) return true;
    return false;
  };

  const getHolidayName = (dateStr) => {
    const holiday = holidays.find(h => h.date === dateStr);
    return holiday ? holiday.name : "";
  };

  const getNextAvailableDate = (startDate) => {
    let date = new Date(startDate);
    while (isDisabledDate(date.toISOString().split("T")[0])) {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split("T")[0];
  };

  const isValidTime = (timeStr) => {
    if (!timeStr) return false;
    return timeStr >= "08:00" && timeStr <= "17:00";
  };

  // --------------------
  // HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
 if (!allFilled) {
  alert("Complete all fields correctly.\nPhone must be +639XXXXXXXXX and ID is required.");
  return;
}

    // FE anomaly detection
    if (isDuplicateToday(name, contactNumber)) {
      showToast("⚠️ Anomaly detected: visitor already registered today.", "error");
      return;
    }

    // Date validation
    if (isDisabledDate(scheduledDate)) {
      const holidayName = getHolidayName(scheduledDate);
      alert(`Selected date is invalid ${holidayName ? `(${holidayName})` : "(weekend/past)"}.\nNext available: ${getNextAvailableDate(scheduledDate)}`);
      setScheduledDate(getNextAvailableDate(scheduledDate));
      return;
    }

    if (!isValidTime(scheduledTime)) {
      alert("Time must be between 8:00 AM and 5:00 PM.");
      return;
    }

    setLoading(true);
    const newAppointment = { name, contactNumber, email, office, purpose, scheduledDate, scheduledTime, idFile };

    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppointment),
      });
      const data = await res.json();

      if (res.status === 409) {
        showToast(data.error || "Duplicate appointment detected.", "error");
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to save appointment");

      saveVisitorToday(name, contactNumber);
      setSavedQR(JSON.stringify({ contactNumber: data.appointment.contactNumber, name: data.appointment.name }));
      setAppointmentSaved(true);
      setFeedbackSubmitted(false);
      if (onNewAppointment) onNewAppointment(data.appointment);
      showToast("✅ Visitor registered!", "success");
    } catch (err) {
      console.error(err);
      showToast(`Server error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // FILE CHANGE
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setIdFile(reader.result);
    reader.readAsDataURL(file);
  };

  // --------------------
  // FEEDBACK
  const handleFeedbackChange = (e) => setFeedback(e.target.value);
  const submitFeedback = async () => {
    if (!contactNumber || feedbackSubmitted) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch(`${API_BASE}/appointments/${contactNumber}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save feedback");

      showToast("✅ Feedback submitted!", "success");
      setFeedbackSubmitted(true);
      setFeedback(data.appointment.feedback || "");
      if (onNewAppointment) onNewAppointment(data.appointment);
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // --------------------
  // RESET FORM
  const resetForm = () => {
    setName(""); setContactNumber("+639"); setEmail(""); setOffice(""); setPurpose("");
    setScheduledDate(""); setScheduledTime(""); setIdFile(null);
    setFeedback(""); setSavedQR(""); setAppointmentSaved(false); setLoading(false);
    setFeedbackSubmitted(false); setFeedbackLoading(false);
    const input = document.getElementById("id-upload");
    if (input) input.value = "";
  };

  // --------------------
  // DOWNLOAD QR
  const downloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${contactNumber}_qr.png`;
    link.click();
  };

  const isDisabled = appointmentSaved || loading;
  const todayStr = new Date().toISOString().split("T")[0];

  // --------------------
// RENDER
return (
  <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f7f8fa", fontFamily: "'Segoe UI', sans-serif", color: "#1f2937" }}>
    <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: "100%", maxWidth: "600px" }}>

      {/* ← BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "16px",
          backgroundColor: "#2563eb",
          color: "white",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        ← Back
      </button>

      {toast && <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "6px", fontWeight: "bold", color: "white", backgroundColor: toast.type === "success" ? "#16a34a" : "#dc2626" }}>{toast.message}</div>}

      <h1 style={{ fontSize: "26px", fontWeight: "700", textAlign: "center", marginBottom: "28px", color: "#111827" }}>Visitor Registration</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* NAME */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={isDisabled} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
          </div>

          {/* CONTACT */}
          <div>
             <label style={{ color: "#111827", fontWeight: "600" }}>Contact Number</label>
            <input type="text" value={contactNumber} onChange={e => {
              let val = e.target.value.replace(/\D/g, ""); 
              if (!val.startsWith("639")) val = "639" + val.slice(3); 
              setContactNumber("+" + val);
            }} disabled={isDisabled} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
          </div>

          {/* EMAIL */}
          <div>
         <label style={{ color: "#111827", fontWeight: "600" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" disabled={isDisabled} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
          </div>

          {/* OFFICE */}
          <div>
             <label style={{ color: "#111827", fontWeight: "600" }}>Office</label>
            <select value={office} onChange={e => setOffice(e.target.value)} disabled={isDisabled} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
              <option value="">Select Office</option>
              {offices.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* PURPOSE */}
          <div>
           <label style={{ color: "#111827", fontWeight: "600" }}>Purpose</label>
            <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} disabled={isDisabled} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
          </div>

          {/* DATE */}
          <div>
            <label style={{ color: "#111827", fontWeight: "600" }}>Scheduled Date</label>
            <input type="date" value={scheduledDate} min={todayStr} onChange={e => setScheduledDate(e.target.value)} disabled={isDisabled} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
            {scheduledDate && getHolidayName(scheduledDate) && (
              <div style={{ color: "#dc2626", fontSize: "14px" }}>⚠ {getHolidayName(scheduledDate)} — Please pick another date.</div>
            )}
          </div>

          {/* TIME */}
          <div>
    <label style={{ color: "#111827", fontWeight: "600" }}>Scheduled Time</label>
            <input type="time" value={scheduledTime} min="08:00" max="17:00" onChange={e => setScheduledTime(e.target.value)} disabled={isDisabled} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
          </div>

          {/* ID UPLOAD */}
          <div>
            <label style={{ color: "#111827", fontWeight: "600" }}>Upload ID</label>
            <input id="id-upload" type="file" accept="image/*" onChange={handleFileChange} disabled={isDisabled} style={{ width: "100%" }} />
          </div>

          {!appointmentSaved && (
            <button type="submit" disabled={loading} style={{ backgroundColor: "#2563eb", color: "white", padding: "14px", borderRadius: "10px", border: "none", fontWeight: "600" }}>
              {loading ? "Checking..." : "Register Visitor"}
            </button>
          )}
        </form>

        {/* FEEDBACK & RESET */}
        {appointmentSaved && (
          <div style={{ marginTop: "16px" }}>
            {!isAdmin && (
              <div style={{ marginBottom: "12px" }}>
                    <label style={{ color: "#111827", fontWeight: "600" }}>Feedback (admin only)</label>
                <textarea value={feedback} onChange={handleFeedbackChange} placeholder="Leave feedback" disabled={feedbackSubmitted || feedbackLoading} style={{ width: "100%", padding: "8px", borderRadius: "6px" }} />
                <button onClick={submitFeedback} disabled={feedbackSubmitted || feedbackLoading} style={{ marginTop: "6px", backgroundColor: "#16a34a", color: "white", padding: "8px 16px", borderRadius: "8px" }}>{feedbackLoading ? "Submitting..." : "Submit Feedback"}</button>
              </div>
            )}
            <button onClick={resetForm} style={{ backgroundColor: "#2563eb", color: "white", padding: "10px 16px", borderRadius: "10px", marginTop: "12px" }}>Register Another Visitor</button>
          </div>
        )}

        {/* ID PREVIEW */}
        {idFile && <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}><img src={idFile} style={{ width: "160px", height: "160px", objectFit: "contain", border: "3px solid #cbd5e1", borderRadius: "10px", padding: "2px" }} /></div>}

        {/* QR CODE */}
        {savedQR && idFile && <div ref={qrRef} style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "center", border: "3px solid #cbd5e1", borderRadius: "10px", padding: "12px" }}>
          <QRCodeCanvas value={savedQR} size={200} level="L" includeMargin />
          <button onClick={downloadQR} style={{ marginTop: "10px", backgroundColor: "#16a34a", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none" }}>Download QR</button>
        </div>}

        <style>{`@keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg); }}`}</style>
      </div>
    </div>
  );
});

export default VisitorRegistration;
