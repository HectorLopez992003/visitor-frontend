import React, { useState } from "react";

const VisitorPublicPage = ({ addVisitor }) => {
  const [visitorName, setVisitorName] = useState("");
  const [visitorID, setVisitorID] = useState("");
  const [office, setOffice] = useState("");
  const [purpose, setPurpose] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!visitorName || !visitorID || !office || !purpose) {
      alert("Please fill out all fields.");
      return;
    }

    const newVisitor = {
      visitorName,
      visitorID,
      office,
      purpose,
      timeIn: new Date().toLocaleString(),
      processed: false,
    };

    addVisitor(newVisitor);
    alert("Registration successful!");
    setVisitorName("");
    setVisitorID("");
    setOffice("");
    setPurpose("");
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-20 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6 text-center">Visitor Registration</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Visitor Name"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Visitor ID"
          value={visitorID}
          onChange={(e) => setVisitorID(e.target.value)}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Office to Visit"
          value={office}
          onChange={(e) => setOffice(e.target.value)}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default VisitorPublicPage;
