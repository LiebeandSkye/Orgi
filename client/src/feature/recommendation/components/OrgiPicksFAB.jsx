import React from "react"; 
import { Link, useLocation } from "react-router-dom"; 
import { Sparkles } from "lucide-react"; 

export function OrgiPicksFAB() { 
  const location = useLocation(); 
  if (location.pathname === "/picks") return null; 

  return ( 
    <Link 
      to="/picks" 
      aria-label="Orgi Picks Recommendation" 
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#0B0F13]/90 border border-[#61F1AC]/50 hover:border-[#61F1AC] text-[#F5F5F5] hover:text-white backdrop-blur-md shadow-2xl shadow-black hover:shadow-[0_0_25px_rgba(97,241,172,0.3)] transition-all duration-300 cursor-pointer group" 
    > 
      <Sparkles size={16} className="text-[#61F1AC] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" /> 
      <span className="text-xs font-semibold tracking-wide">Orgi Picks</span> 
    </Link> 
  ); 
} 
