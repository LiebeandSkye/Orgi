import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="text-center py-32 space-y-4 max-w-md mx-auto px-6">
      <div className="font-mono text-5xl font-light text-[#61F1AC]">404</div>
      <h2 className="text-2xl font-light text-[#F5F5F5] tracking-tight">
        Content Not Found
      </h2>
      <p className="text-xs text-[#7A7A7A] leading-relaxed">
        The title, series, or catalogue item you are seeking does not exist or has been relocated in the rate archive.
      </p>
      <div className="pt-4">
        <Link to="/">
          <Button variant="primary" size="sm" className="rounded-full px-5 py-2">
            Return to Interstellar
          </Button>
        </Link>
      </div>
    </div>
  );
}
