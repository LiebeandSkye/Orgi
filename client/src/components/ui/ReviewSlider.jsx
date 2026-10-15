import React, { useState, useEffect } from "react"; 
import { Star } from "lucide-react"; 

export function ReviewSlider({ value = 8, onChange, disabled = false }) { 
  const safeVal = Math.max(1, Math.min(10, Math.round(Number(value) || 1))); 
  const [dragVal, setDragVal] = useState(safeVal); 
  const [isDragging, setIsDragging] = useState(false); 

  useEffect(() => { 
    if (!isDragging) { 
      setDragVal(safeVal); 
    } 
  }, [safeVal, isDragging]); 

  const activeVal = isDragging ? dragVal : safeVal; 
  const fillPct = ((activeVal - 1) / 9) * 100; 

  const handleCommit = (val) => { 
    setIsDragging(false); 
    const snapped = Math.max(1, Math.min(10, Math.round(Number(val)))); 
    setDragVal(snapped); 
    if (onChange) onChange(snapped); 
  }; 

  return ( 
    <div className="flex flex-col gap-2 w-full max-w-[320px]"> 
      <div className="flex items-center justify-between text-xs"> 
        <span className="text-[#7A7A7A] font-medium tracking-wide uppercase text-[10px]"> 
          Your Score 
        </span> 
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#202020]"> 
          <Star size={11} className="fill-[#61F1AC] text-[#61F1AC]" /> 
          <span className="font-semibold text-[#61F1AC] font-tabular text-xs"> 
            {activeVal} / 10 
          </span> 
        </div> 
      </div> 

      <div className="relative flex items-center py-1"> 
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="1" 
          value={activeVal} 
          disabled={disabled} 
          onPointerDown={() => setIsDragging(true)} 
          onPointerUp={(e) => handleCommit(e.target.value)} 
          onTouchEnd={(e) => handleCommit(e.target.value)} 
          onKeyUp={(e) => handleCommit(e.target.value)} 
          onChange={(e) => { 
            const val = parseInt(e.target.value, 10); 
            setDragVal(val); 
            if (!isDragging && onChange) { 
              onChange(val); 
            } 
          }} 
          style={{ 
            background: `linear-gradient(to right, #61F1AC 0%, #61F1AC ${fillPct}%, #1E1E1E ${fillPct}%, #1E1E1E 100%)`, 
          }} 
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#61F1AC] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-all" 
        /> 
      </div> 

      <div className="relative w-full h-4 select-none"> 
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => { 
          const pct = ((num - 1) / 9) * 100; 
          const isSelected = activeVal === num; 
          return ( 
            <button 
              key={num} 
              type="button" 
              disabled={disabled} 
              onClick={() => handleCommit(num)} 
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }} 
              className={`absolute top-0 text-[10px] font-tabular transition-all cursor-pointer ${ 
                isSelected 
                  ? "text-[#61F1AC] font-bold scale-115" 
                  : "text-[#555555] hover:text-[#B5B5B5]" 
              }`} 
            > 
              {num} 
            </button> 
          ); 
        })} 
      </div> 
    </div> 
  ); 
} 
