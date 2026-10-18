import React from "react"; 
import { Link } from "react-router-dom"; 
import { Sparkles } from "lucide-react"; 

export function OrgiPicksButton({ className = "" }) { 
  return ( 
    <Link 
      to="/picks" 
      className={`group relative inline-flex items-center justify-center gap-2 px-5 h-[54px] rounded-full bg-[#0B0F13] border border-[#61F1AC]/50 hover:border-[#61F1AC] text-[#F5F5F5] hover:text-white text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(97,241,172,0.15)] hover:shadow-[0_0_30px_rgba(97,241,172,0.3)] hover:bg-[#61F1AC]/10 cursor-pointer shrink-0 ${className}`} 
    > 
      <Sparkles size={16} className="text-[#61F1AC] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" /> 
      <span>Orgi Picks</span> 
    </Link> 
  ); 
} 
