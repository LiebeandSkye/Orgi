import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout() {
  const location = useLocation();
  const isManhwaPage = location.pathname === "/books/manhwa";

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] selection:bg-[#61F1AC] selection:text-black flex flex-col">
      <Navbar forceBooksOpen={isManhwaPage} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
