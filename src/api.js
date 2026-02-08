// api.js
export const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://visitor-backend-tan.vercel.app/api";
