import React, { createContext, useContext, useState, useCallback } from "react"; 
import { X } from "lucide-react"; 
import { AuthForm } from "../feature/auth/components/AuthForm"; 

const ToastContext = createContext(null); 

export function ToastProvider({ children }) { 
  const [toasts, setToasts] = useState([]); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); 

  const removeToast = useCallback((id) => { 
    setToasts((prev) => prev.filter((t) => t.id !== id)); 
  }, []); 

  const showToast = useCallback(({ message, type = "info", actionText, onAction, duration = 4500 }) => { 
    const id = Date.now() + Math.random().toString(36).substring(2, 9); 
    const newToast = { id, message, type, actionText, onAction }; 

    setToasts((prev) => [...prev, newToast]); 

    if (duration > 0) { 
      setTimeout(() => { 
        removeToast(id); 
      }, duration); 
    } 
    return id; 
  }, [removeToast]); 

  const showAuthPrompt = useCallback((message = "Please sign in to continue.") => { 
    return showToast({ 
      message, 
      actionText: "Sign In", 
      onAction: () => setIsAuthModalOpen(true), 
      duration: 5000, 
    }); 
  }, [showToast]); 

  const openAuthModal = useCallback(() => { 
    setIsAuthModalOpen(true); 
  }, []); 

  const closeAuthModal = useCallback(() => { 
    setIsAuthModalOpen(false); 
  }, []); 

  return ( 
    <ToastContext.Provider 
      value={{ 
        showToast, 
        showAuthPrompt, 
        removeToast, 
        openAuthModal, 
        closeAuthModal, 
        isAuthModalOpen, 
      }} 
    > 
      {children} 

      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"> 
        {toasts.map((toast) => ( 
          <div 
            key={toast.id} 
            className="pointer-events-auto bg-[#0E0E0E] border border-[#222222] text-[#F5F5F5] rounded-md p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200" 
          > 
            <div className="flex items-center gap-2.5 min-w-0"> 
              <span className="w-2 h-2 rounded-full bg-[#61F1AC] shadow-[0_0_8px_#61F1AC] shrink-0" /> 
              <span className="text-xs font-medium text-[#E5E5E5] leading-snug">{toast.message}</span> 
            </div> 
            <div className="flex items-center gap-2 shrink-0"> 
              {toast.actionText && ( 
                <button 
                  type="button" 
                  onClick={() => { 
                    toast.onAction?.(); 
                    removeToast(toast.id); 
                  }} 
                  className="px-3 py-1 bg-[#61F1AC] hover:bg-[#4ee89f] text-black text-xs font-semibold rounded-sm cursor-pointer transition-all active:scale-95 shadow-sm" 
                > 
                  {toast.actionText} 
                </button> 
              )} 
              <button 
                type="button" 
                onClick={() => removeToast(toast.id)} 
                className="text-[#666666] hover:text-[#F5F5F5] p-1 rounded transition-colors cursor-pointer" 
              > 
                <X size={14} /> 
              </button> 
            </div> 
          </div> 
        ))} 
      </div> 

      {isAuthModalOpen && ( 
        <div 
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200" 
          onClick={closeAuthModal} 
        > 
          <div 
            className="relative w-full max-w-sm animate-modal-pop" 
            onClick={(e) => e.stopPropagation()} 
          > 
            <button 
              type="button" 
              onClick={closeAuthModal} 
              aria-label="Close" 
              className="absolute -top-3 -right-3 z-30 text-[#7A7A7A] hover:text-[#F5F5F5] p-1.5 rounded-full bg-[#141414] border border-[#2A2A2A] transition-colors cursor-pointer shadow-lg" 
            > 
              <X size={16} /> 
            </button> 
            <AuthForm onSuccess={closeAuthModal} /> 
          </div> 
        </div> 
      )} 
    </ToastContext.Provider> 
  ); 
} 

export const useToast = () => { 
  const context = useContext(ToastContext); 
  if (!context) { 
    return { 
      showToast: () => {}, 
      showAuthPrompt: () => {}, 
      removeToast: () => {}, 
      openAuthModal: () => {}, 
      closeAuthModal: () => {}, 
      isAuthModalOpen: false, 
    }; 
  } 
  return context; 
}; 
