// src/app/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./AppShell.jsx";

import Sales from "@/pages/Sales.jsx";
import AddFabric from "@/pages/AddFabric.jsx";
import ProductSettings from "@/pages/ProductSettings.jsx";
import EventManagement from "@/pages/EventManagement.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* AppShell is the layout; children render inside <Outlet/> */}
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/sales" replace />} />
        <Route path="sales" element={<Sales />} />
        <Route path="event" element={<EventManagement />} />
        <Route path="add-fabric" element={<AddFabric />} />
        <Route path="product-settings" element={<ProductSettings />} />
        {/* Fallback: anything unknown goes to Sales */}
        <Route path="*" element={<Navigate to="/sales" replace />} />
      </Route>
    </Routes>
  );
}
