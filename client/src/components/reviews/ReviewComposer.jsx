import React, { useRef } from "react"; 
import { Check } from "lucide-react"; 
import { Button } from "../ui/Button"; 
import { ReviewSlider } from "../ui/ReviewSlider"; 
import { CommentFormattingToolbar, handleFormattingKeyDown } from "../common/CommentFormattingToolbar"; 
 
export const DEFAULT_AVATAR = 
  "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"; 
 
export function ReviewComposer({ 
  avatar, 
  content = "", 
  onChangeContent, 
  score = 8, 
  onChangeScore, 
  isAnonymous = false, 
  onChangeAnonymous, 
  isEditing = false, 
  isSubmitting = false, 
  onSubmit, 
  onCancel, 
  placeholder, 
  submitLabel, 
  className = "", 
}) { 
  const textareaRef = useRef(null); 
  const effectiveAvatar = isAnonymous || !avatar ? DEFAULT_AVATAR : avatar; 
 
  return ( 
    <div className={`bg-[#0B0B0B] border border-[#1C1C1C] rounded-[16px] p-5 shadow-sm ${className}`}> 
      <div className="flex items-start gap-3.5 mb-4"> 
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#141414] ring-1 ring-[#1C1C1C] flex items-center justify-center"> 
          <img 
            src={effectiveAvatar} 
            alt="User Avatar" 
            referrerPolicy="no-referrer" 
            className="w-full h-full object-cover" 
          /> 
        </div> 
        <div className="flex-1 min-w-0"> 
          <textarea 
            ref={textareaRef} 
            value={content} 
            onChange={(e) => onChangeContent?.(e.target.value)} 
            onKeyDown={(e) => handleFormattingKeyDown(e, textareaRef.current, content, onChangeContent)} 
            placeholder={placeholder || (isEditing ? "Update your thought…" : "Add a thought…")} 
            rows={3} 
            className="w-full bg-transparent text-[#F5F5F5] placeholder-[#7A7A7A] text-sm resize-none focus:outline-none leading-relaxed" 
          /> 
          <CommentFormattingToolbar 
            textareaRef={textareaRef} 
            value={content} 
            onChange={onChangeContent} 
            className="mt-1" 
          /> 
        </div> 
      </div> 
       
      <div className="flex flex-col gap-3 pt-3 border-t border-[#1C1C1C]/60"> 
        <label className="group flex items-center gap-2 cursor-pointer select-none text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors w-fit"> 
          <input 
            type="checkbox" 
            checked={isAnonymous} 
            onChange={(e) => onChangeAnonymous?.(e.target.checked)} 
            className="peer sr-only" 
          /> 
          <span className="flex items-center justify-center w-4 h-4 rounded-full border border-[#2C2C2C] bg-[#141414] transition-all duration-200 group-hover:border-[#61F1AC]/50 peer-checked:bg-[#61F1AC] peer-checked:border-[#61F1AC] peer-focus-visible:ring-2 peer-focus-visible:ring-[#61F1AC]/40 [&>svg]:scale-0 peer-checked:[&>svg]:scale-100"> 
            <Check 
              size={10} 
              strokeWidth={3.5} 
              className="text-white transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
            /> 
          </span> 
          <span>Post anonymously</span> 
        </label> 
         
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"> 
          <ReviewSlider value={score} onChange={onChangeScore} /> 
           
          <div className="flex items-center gap-3 self-end sm:self-center flex-wrap"> 
            {(isEditing || onCancel) && ( 
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCancel} 
                className="px-3.5 py-1.5 rounded-lg text-xs cursor-pointer" 
              > 
                Cancel 
              </Button> 
            )} 
            <Button 
              variant="primary" 
              size="sm" 
              disabled={!content.trim() || isSubmitting} 
              onClick={onSubmit} 
              className="px-4 py-1.5 rounded-lg text-xs cursor-pointer" 
            > 
              {isSubmitting ? "Saving..." : submitLabel || (isEditing ? "Publish" : "Post")} 
            </Button> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
}
