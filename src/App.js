import React, { useState } from "react";
import VisitorPublicPage from "./pages/VisitorPublicPage";

function App() {
  const [visitors, setVisitors] = useState([]);

  const addVisitor = (visitor) => {
    setVisitors((prev) => [...prev, visitor]);
  };

  return <VisitorPublicPage addVisitor={addVisitor} />;
}

export default App;
