// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@/index.css";
import AppRoutes from "@/app/AppRoutes.jsx";

import { SalesProvider } from "@/state/sales.jsx";
import { EventsProvider } from "@/state/events.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Keep exactly ONE router at the top level */}
    <BrowserRouter>
      <SalesProvider>
        <EventsProvider>
          <AppRoutes />
        </EventsProvider>
      </SalesProvider>
    </BrowserRouter>
  </React.StrictMode>
);
