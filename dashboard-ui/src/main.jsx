import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx"; // Your Command Center
import MobileView from "./MobileView.jsx"; // The new public app
import "./index.css";
import SectorDetails from "./SectorDetails.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* The Enterprise Command Center (Default) */}
        <Route path="/" element={<App />} />

        {/* The Mobile Interface (QR Code Link) */}
        <Route path="/public" element={<MobileView />} />
        <Route path="/sector/:sectorId" element={<SectorDetails />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
