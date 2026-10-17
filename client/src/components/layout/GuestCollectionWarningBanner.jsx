import React, { useState, useEffect } from "react"; 
import { AlertTriangle, ArrowRight } from "lucide-react"; 
import { useAuth } from "../../context/AuthContext"; 
import { useToast } from "../../context/ToastContext"; 
import { getGuestCollection } from "../../utils/guestCollection"; 

export function GuestCollectionWarningBanner() { 
  const { user } = useAuth(); 
  const { openAuthModal } = useToast(); 
  const [count, setCount] = useState(() => getGuestCollection().length); 

  useEffect(() => { 
    const update = () => { 
      setCount(getGuestCollection().length); 
    }; 
    window.addEventListener("orgi_guest_collection_changed", update); 
    return () => { 
      window.removeEventListener("orgi_guest_collection_changed", update); 
    }; 
  }, []); 

  if (user || count === 0) return null; 

  return ( 
    <div className="bg-[#161206] border-b border-[#F59E0B]/30 px-4 py-2.5 sm:px-6 text-xs text-[#FBBF24] flex items-center justify-between gap-3 shadow-inner z-40"> 
      <div className="flex items-center gap-2.5 min-w-0"> 
        <AlertTriangle size={15} className="text-[#F59E0B] shrink-0" /> 
        <span className="truncate"> 
          Your collection ({count} item{count === 1 ? "" : "s"}) is only saved locally in this browser. Log in to save it in our database. 
        </span> 
      </div> 
      <button 
        type="button" 
        onClick={openAuthModal} 
        className="px-3 py-1 bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-md shrink-0 cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm" 
      > 
        <span>Log In</span> 
        <ArrowRight size={13} /> 
      </button> 
    </div> 
  ); 
} 
