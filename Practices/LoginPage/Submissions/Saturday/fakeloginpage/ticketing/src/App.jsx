import { Routes, Route, Navigate } from "react-router-dom";
import Display from "./pages/display.jsx";
import Admin   from "./pages/admin.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public display — ticketing.saturday-s.com/ */}
      <Route path="/"      element={<Display />} />

      {/* Admin panel — ticketing.saturday-s.com/admin */}
      <Route path="/admin" element={<Admin />} />

      {/* Catch-all → redirect to display */}
      <Route path="*"      element={<Navigate to="/" replace />} />
    </Routes>
  );
}
