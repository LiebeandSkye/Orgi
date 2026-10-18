import React from "react"; 
import { Film, BookOpen, ArrowRight, Check, Play } from "lucide-react"; 

export function StepMediumSelector({ 
  medium, 
  onSelectMedium, 
  onNext, 
}) { 
  return ( 
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-6xl mx-auto py-6"> 
      <div className="lg:col-span-6 flex flex-col"> 
        <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-light tracking-tight text-[#F5F5F5] leading-[1.15] mb-4"> 
          What do you want to{" "} 
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]"> 
            watch or read? 
          </span> 
        </h1> 

        <p className="text-sm text-[#9CA3AF] leading-relaxed mb-8 max-w-md"> 
          Pick the type of content you're in the mood for. We'll tailor your next steps based on your choice. 
        </p> 

        <div className="grid grid-cols-2 gap-4 mb-8"> 
          <button 
            type="button" 
            onClick={() => onSelectMedium("movie")} 
            className={`relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] ${ 
              medium === "movie" 
                ? "bg-[#61F1AC]/10 border-[#61F1AC] shadow-[0_0_30px_rgba(97,241,172,0.18)]" 
                : "bg-[#0B0F13] border-[#1E262F] hover:border-white/20" 
            }`} 
          > 
            <div className="flex items-center justify-between w-full"> 
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${ 
                medium === "movie" 
                  ? "border-[#61F1AC]/40 bg-[#61F1AC]/15 text-[#61F1AC]" 
                  : "border-[#1E262F] bg-black/40 text-[#7A7A7A]" 
              }`}> 
                <Film size={20} /> 
              </div> 
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${ 
                medium === "movie" 
                  ? "border-[#61F1AC] bg-[#61F1AC] text-black" 
                  : "border-[#2A3441] bg-transparent" 
              }`}> 
                {medium === "movie" && <Check size={14} className="stroke-[3]" />} 
              </div> 
            </div> 

            <div> 
              <div className="text-base font-semibold text-[#F5F5F5] mb-0.5">Movie</div> 
              <div className="text-xs text-[#7A7A7A]">Films, anime, series</div> 
            </div> 
          </button> 

          <button 
            type="button" 
            onClick={() => onSelectMedium("book")} 
            className={`relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] ${ 
              medium === "book" 
                ? "bg-[#61F1AC]/10 border-[#61F1AC] shadow-[0_0_30px_rgba(97,241,172,0.18)]" 
                : "bg-[#0B0F13] border-[#1E262F] hover:border-white/20" 
            }`} 
          > 
            <div className="flex items-center justify-between w-full"> 
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${ 
                medium === "book" 
                  ? "border-[#61F1AC]/40 bg-[#61F1AC]/15 text-[#61F1AC]" 
                  : "border-[#1E262F] bg-black/40 text-[#7A7A7A]" 
              }`}> 
                <BookOpen size={20} /> 
              </div> 
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${ 
                medium === "book" 
                  ? "border-[#61F1AC] bg-[#61F1AC] text-black" 
                  : "border-[#2A3441] bg-transparent" 
              }`}> 
                {medium === "book" && <Check size={14} className="stroke-[3]" />} 
              </div> 
            </div> 

            <div> 
              <div className="text-base font-semibold text-[#F5F5F5] mb-0.5">Book</div> 
              <div className="text-xs text-[#7A7A7A]">Manga, manhwa, novels</div> 
            </div> 
          </button> 
        </div> 

        <button 
          type="button" 
          onClick={onNext} 
          className="w-full sm:w-fit px-8 py-3.5 rounded-full bg-[#61F1AC] hover:bg-[#52deb0] text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#61F1AC]/25 hover:shadow-[0_0_30px_rgba(97,241,172,0.35)] transition-all cursor-pointer" 
        > 
          <span>Next</span> 
          <ArrowRight size={16} /> 
        </button> 
      </div> 

      <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px]"> 
        <div className="absolute top-2 right-4 z-20 hidden sm:flex items-center gap-2 text-right"> 
          <div className="text-xs text-[#9CA3AF] max-w-[150px] leading-snug font-light italic"> 
            Choose your medium. We'll adapt the questions for you. 
          </div> 
          <svg className="w-10 h-10 text-[#61F1AC] -rotate-12" viewBox="0 0 40 40" fill="none"> 
            <path d="M5 10 C 15 5, 25 20, 32 30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" /> 
            <path d="M25 28 L 32 30 L 30 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> 
          </svg> 
        </div> 

        <div className="relative w-full max-w-md h-[400px] flex items-center justify-center"> 
          <div className="absolute left-6 top-8 w-48 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 bg-[#0B0F13] shadow-2xl opacity-40 -rotate-12 scale-90 pointer-events-none transition-transform duration-500"> 
            <img 
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80" 
              alt="Atmospheric cinema preview" 
              className="w-full h-full object-cover" 
            /> 
          </div> 

          <div className={`absolute z-10 w-56 aspect-[2/3] rounded-2xl overflow-hidden border transition-all duration-500 shadow-2xl ${ 
            medium === "movie" 
              ? "left-8 top-4 rotate-2 scale-102 border-[#61F1AC] shadow-[0_0_40px_rgba(97,241,172,0.3)] z-20" 
              : "left-6 top-6 -rotate-6 scale-95 border-white/15 opacity-75" 
          }`}> 
            <img 
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80" 
              alt="Your Name anime visual" 
              className="w-full h-full object-cover" 
            /> 
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" /> 
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between"> 
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-white bg-black/60 px-2.5 py-1 rounded-md border border-white/10"> 
                <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC]" /> 
                <span>MOVIE</span> 
              </div> 
              <div className="w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white"> 
                <Play size={14} className="fill-white translate-x-0.5" /> 
              </div> 
            </div> 
          </div> 

          <div className={`absolute z-10 w-56 aspect-[2/3] rounded-2xl overflow-hidden border transition-all duration-500 shadow-2xl ${ 
            medium === "book" 
              ? "right-6 top-4 -rotate-2 scale-102 border-[#61F1AC] shadow-[0_0_40px_rgba(97,241,172,0.3)] z-20" 
              : "right-4 top-8 rotate-6 scale-95 border-white/15 opacity-75" 
          }`}> 
            <img 
              src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80" 
              alt="The Book Thief cover art" 
              className="w-full h-full object-cover" 
            /> 
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" /> 
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between"> 
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-white bg-black/60 px-2.5 py-1 rounded-md border border-white/10"> 
                <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC]" /> 
                <span>BOOK</span> 
              </div> 
              <div className="w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white"> 
                <BookOpen size={14} /> 
              </div> 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
} 
