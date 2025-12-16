import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { API_BASE } from "../api"; // adjust path if needed

const VisitorRegistration = () => {
  const [name, setName] = useState("");
  const [visitorID, setVisitorID] = useState("");
  const [office, setOffice] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [success, setSuccess] = useState(false);

  const offices = ["Registrar", "Guidance", "Cashier", "Dean", "Library"];

  const qrValue =
    name && visitorID && office && purpose && scheduledDate && scheduledTime && idFile
      ? JSON.stringify({ visitorID, name })
      : "";

  // API call to add visitor
  const addVisitor = async (visitorData, callback) => {
    try {
      const res = await fetch(`${API_BASE}/visitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitorData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to register visitor");
        return;
      }

      callback(); // reset form
    } catch (err) {
      console.error("Error registering visitor:", err);
      alert("Server error: Failed to register visitor");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !visitorID || !office || !purpose || !scheduledDate || !scheduledTime || !idFile) {
      alert("Please fill in all fields and upload an ID.");
      return;
    }

    const newVisitor = {
      name,
      visitorID,
      office,
      purpose,
      scheduledDate,
      scheduledTime,
      idFile,
      qrData: qrValue,
    };

    addVisitor(newVisitor, () => {
      setName("");
      setVisitorID("");
      setOffice("");
      setPurpose("");
      setScheduledDate("");
      setScheduledTime("");
      setIdFile(null);
      document.getElementById("id-upload").value = "";
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setIdFile(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Visitor Registration
      </h1>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 font-semibold text-center rounded">
          Visitor registered successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Visitor ID</label>
            <input
              type="text"
              value={visitorID}
              onChange={(e) => setVisitorID(e.target.value.replace(/\D/g, ""))}
              className="border p-3 rounded-lg"
              placeholder="Numbers only"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Office</label>
            <select
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="border p-3 rounded-lg"
            >
              <option value="">Select Office</option>
              {offices.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Purpose</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Scheduled Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Scheduled Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Upload ID</label>
            <input
              type="file"
              id="id-upload"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {idFile && (
          <div className="flex justify-center mt-2">
            <img
              src={idFile}
              alt="ID Preview"
              className="w-32 h-32 object-contain border-2 border-gray-300 rounded-lg p-1"
            />
          </div>
        )}

        {qrValue && (
          <div className="flex justify-center mt-2">
            <div className="border-2 border-gray-300 rounded-lg p-2">
              <QRCodeCanvas value={qrValue} size={160} />
            </div>
          </div>
        )}

        <button className="w-full bg-blue-600 text-white py-3 rounded-lg mt-4 hover:bg-blue-700 transition">
          Register Visitor
        </button>
      </form>
    </div>
  );
};

export default VisitorRegistration;
