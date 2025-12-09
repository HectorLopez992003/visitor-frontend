import React, { useState } from "react";
import VisitorPublicPage from "./pages/VisitorPublicPage";

function App() {
  const [visitors, setVisitors] = useState([]);

  // Add visitor to main system
  const addVisitor = (visitor) => {
    setVisitors((prev) => [...prev, visitor]);
    console.log("Visitor added to main system:", visitor);
  };

  return <VisitorPublicPage addVisitor={addVisitor} />;
}

export default App;
