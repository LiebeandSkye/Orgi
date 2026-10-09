import { Link, NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui/Button";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
    }`;

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <span className="text-xl">⚡</span>
          <span>AppTemplate</span>
        </Link>

        <div className="flex items-center gap-4">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>

          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </Button>
        </div>
      </div>
    </nav>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Built with React, Tailwind CSS &amp; Express
      </footer>
    </div>
  );
}
