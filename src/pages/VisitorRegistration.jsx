import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { API_BASE } from "../api";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";

const VisitorRegistration = () => {
  // Step management
  const [step, setStep] = useState(1);

  // Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("+639");

  // Appointment Info
  const [office, setOffice] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // ID & QR
  const [idFile, setIdFile] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  const webcamRef = useRef(null);

  const offices = ["Registrar", "Guidance", "Cashier", "Dean", "Library"];
  const holidays = ["2026-01-01", "2026-04-09", "2026-06-12", "2026-12-25"];
  const today = new Date().toISOString().split("T")[0];

  // Logic Functions (Unchanged)
  const isWeekend = (dateStr) => {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  };
  const isHoliday = (dateStr) => holidays.includes(dateStr);
  const isValidContactNumber = (num) => /^\+639\d{9}$/.test(num);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isStep2Complete = office && purpose.trim() && scheduledDate && scheduledTime && idFile;

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        alert("Please enter your full name.");
        return;
      }
      if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
      }
      if (!isValidContactNumber(contactNumber)) {
        alert("Please enter a valid Philippine contact number (+639XXXXXXXXX).");
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => setStep(step - 1);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setIdFile(reader.result);
    reader.readAsDataURL(file);
  };

  const captureID = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setIdFile(imageSrc);
    setCameraOpen(false);

    try {
      const img = new Image();
      img.src = imageSrc;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          imageData.data[i] = avg; imageData.data[i + 1] = avg; imageData.data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
        const processedData = canvas.toDataURL("image/png");
        const { data: { text } } = await Tesseract.recognize(processedData, "eng");
        const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && /[A-Za-z]/.test(l));
        if (lines.length > 0) {
          const detectedName = lines[0].split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          setFirstName(detectedName[0] || "");
          setLastName(detectedName.slice(1).join(" ") || "");
        }
      };
    } catch (err) {
      console.error("OCR failed:", err);
    }
  };

  const isDuplicateVisitor = () => {
    const stored = JSON.parse(localStorage.getItem("registeredVisitors") || "[]");
    return stored.some(v => v.contactNumber === contactNumber && v.scheduledDate === scheduledDate && v.scheduledTime === scheduledTime);
  };

  const saveVisitorLocally = () => {
    const stored = JSON.parse(localStorage.getItem("registeredVisitors") || "[]");
    stored.push({ contactNumber, scheduledDate, scheduledTime });
    localStorage.setItem("registeredVisitors", JSON.stringify(stored));
  };

  const handleSubmit = () => {
    if (!isStep2Complete) { alert("Please complete all fields correctly."); return; }
    if (isWeekend(scheduledDate) || isHoliday(scheduledDate)) { alert("Selected date is not allowed."); return; }
    if (scheduledTime < "08:00" || scheduledTime > "17:00") { alert("Office hours are only 8:00 AM to 5:00 PM."); return; }
    if (isDuplicateVisitor()) { alert("Duplicate visitor detected for this date and time."); return; }

    const fullName = `${firstName} ${lastName}`;
    const qrData = JSON.stringify({ contactNumber, name: fullName });
    setQrValue(qrData);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-slate-900 py-8 px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">UniVentry</h1>
          <p className="text-slate-400 mt-2 font-medium">Campus Visitor Management System</p>
        </div>

        <div className="p-8">
          {/* Progress Tracker */}
          <div className="flex items-center justify-center mb-10">
            {[1, 2, 3].map((s, index) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-colors ${
                  step >= s ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300 text-slate-400"
                }`}>
                  {s}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-2 rounded ${step > s ? "bg-indigo-600" : "bg-slate-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="John" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full border p-3 rounded-xl focus:ring-2 outline-none transition ${email && !isValidEmail(email) ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500"}`} placeholder="john.doe@example.com" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Contact Number</label>
                <input type="text" value={contactNumber} onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (!val.startsWith("639")) val = "639" + val.slice(3);
                  val = val.slice(0, 12);
                  setContactNumber("+" + val);
                }} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
              </div>

              <button type="button" onClick={handleNext} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl mt-6 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                Continue to Appointment
              </button>
            </div>
          )}

          {/* Step 2: Appointment & ID */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Appointment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Target Office</label>
                  <select value={office} onChange={(e) => setOffice(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Select Office</option>
                    {offices.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Purpose of Visit</label>
                  <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Reason" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Date</label>
                  <input type="date" value={scheduledDate} min={today} onChange={(e) => {
                    const selected = e.target.value;
                    if (isWeekend(selected)) return alert("Weekends not allowed.");
                    if (isHoliday(selected)) return alert("Holiday selected.");
                    setScheduledDate(selected);
                  }} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Time</label>
                  <input type="time" value={scheduledTime} min="08:00" max="17:00" onChange={(e) => setScheduledTime(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                <label className="text-sm font-bold text-slate-700 block">Identity Verification</label>
                <div className="flex flex-wrap gap-3">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                  <button type="button" onClick={() => { if (idFile) return alert("ID already uploaded."); setCameraOpen(true); }} className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition">
                    Use Webcam
                  </button>
                </div>

                {cameraOpen && (
                  <div className="mt-4 flex flex-col items-center bg-black p-2 rounded-xl">
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/png" width={320} className="rounded-lg" />
                    <div className="flex gap-3 mt-3 pb-2">
                      <button type="button" onClick={captureID} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700">Capture</button>
                      <button type="button" onClick={() => setCameraOpen(false)} className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700">Cancel</button>
                    </div>
                  </div>
                )}

                {idFile && (
                  <div className="mt-4 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">ID Preview Received</p>
                    <img src={idFile} alt="Preview" className="mx-auto w-40 h-28 object-cover border-4 border-white shadow-md rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleBack} className="flex-1 bg-slate-200 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-300 transition">Back</button>
                <button type="button" onClick={handleSubmit} className="flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition">Register Visitor</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && qrValue && (
            <div className="flex flex-col items-center py-6 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Registration Successful</h2>
              <p className="text-slate-500 mb-6 text-center">Please save your QR code. You will need to present this upon entry.</p>
              
              <div className="bg-white p-6 rounded-2xl shadow-inner border border-slate-100 mb-6">
                <p className="text-center font-bold text-indigo-900 text-lg mb-4">{`${firstName} ${lastName}`}</p>
                <QRCodeCanvas value={qrValue} size={200} className="mx-auto" />
              </div>

              <button
                type="button"
                onClick={async () => {
                  const visitorData = {
                    name: `${firstName} ${lastName}`, contactNumber, email, office, purpose,
                    scheduledDate, scheduledTime, idFile, qrData: qrValue,
                  };
                  try {
                    const res = await fetch(`${API_BASE}/visitors`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(visitorData),
                    });
                    const data = await res.json();
                    if (!res.ok) { alert(data.error || "Failed to save visitor"); return; }
                    saveVisitorLocally();
                    alert("Visitor successfully saved to UniVentry!");
                    setStep(1); setQrValue(""); setFirstName(""); setLastName(""); setEmail(""); setContactNumber("+639");
                    setOffice(""); setPurpose(""); setScheduledDate(""); setScheduledTime(""); setIdFile(null);
                  } catch (err) { alert("Server error during registration"); }
                }}
                className="w-full max-w-sm bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition"
              >
                Confirm & Finalize
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorRegistration;