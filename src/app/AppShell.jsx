// src/app/AppShell.jsx
import { NavLink, Outlet } from "react-router-dom";

// PNG icons
import iconLogo from "@/components/icons/iconLogo.png";
import iconMoon from "@/components/icons/iconMoon.png";
import iconShootingStar from "@/components/icons/iconShootingStar.png";
import iconSolar from "@/components/icons/iconSolar.png";
import iconStars from "@/components/icons/iconStars.png";

export default function AppShell() {
  // Match these to your actual routes
  const nav = [
    { to: "/sales",            label: "Sales",      icon: iconLogo },
    { to: "/event",            label: "Event",      icon: iconSolar },
    { to: "/add-fabric",       label: "Add Fabric", icon: iconStars },
    { to: "/product-settings", label: "Settings",   icon: iconMoon },
  ];

  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="grid">
          <Outlet />
        </div>
      </main>

      {/* single sticky bottom nav (styled by .app-nav / .app-nav-link / .nav-icon) */}
      <nav className="app-nav">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              "app-nav-link" + (isActive ? " is-active" : "")
            }
            aria-label={item.label}
          >
            <img src={item.icon} alt="" className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
