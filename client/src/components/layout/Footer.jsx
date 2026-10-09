import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full mt-24 pb-12 pt-6 text-xs text-[#7A7A7A] select-none">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] flex items-center justify-between">
        <div>
          <span>© 2026 rate. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-8">
          <Link
            to="/about"
            onClick={(e) => e.preventDefault()}
            className="hover:text-[#F5F5F5] transition-colors"
          >
            About
          </Link>
          <Link
            to="/privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            onClick={(e) => e.preventDefault()}
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
