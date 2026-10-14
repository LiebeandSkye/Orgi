import React from "react"; 
import { Star } from "lucide-react"; 
 
export function ReviewSlider({ value = 8, onChange, disabled = false }) { 
  const safeVal = Math.max(1, Math.min(10, Number(value) || 1)); 
 
  return ( 
    <div className="flex flex-col gap-2 w-full max-w-[280px]"> 
      <div className="flex items-center justify-between text-xs"> 
        <span className="text-[#7A7A7A] font-medium tracking-wide uppercase text-[10px]"> 
          Your Score 
        </span> 
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#202020]"> 
          <Star size={11} className="fill-[#61F1AC] text-[#61F1AC]" /> 
          <span className="font-semibold text-[#61F1AC] font-tabular text-xs"> 
            {safeVal} / 10 
          </span> 
        </div> 
      </div> 
 
      <div className="relative flex items-center"> 
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="1" 
          value={safeVal} 
          disabled={disabled} 
          onChange={(e) => onChange && onChange(parseInt(e.target.value, 10))} 
          className="w-full h-1.5 bg-[#1C1C1C] rounded-lg appearance-none cursor-pointer accent-[#61F1AC] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none" 
        /> 
      </div> 
 
      <div className="flex justify-between px-0.5 text-[10px] text-[#4A4A4A] font-tabular"> 
        <span>1</span> 
        <span>3</span> 
        <span>5</span> 
        <span>7</span> 
        <span>10</span> 
      </div> 
    </div> 
  ); 
} 
