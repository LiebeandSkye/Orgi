import React from "react"; 
import { 
  Check, 
  Minus, 
  Play, 
  Star, 
  Bookmark, 
  Share2, 
  Film, 
  BookOpen, 
  Tag, 
} from "lucide-react"; 

export function AiVerdictHero({ 
  movieData, 
  verdictData, 
  blendedScore, 
  totalVotesLabel, 
  inCollection, 
  collectionLoading, 
  onToggleCollection, 
  onPlayTrailer, 
  isLoadingTrailer, 
  onOpenReviews, 
  onShare, 
  category, 
}) { 
  const isPrint = ["manga", "manhwa", "manhua", "book", "books"].includes( 
    String(category || movieData?.type || "").toLowerCase() 
  ); 

  const scoreDisplay = blendedScore 
    ? Number(blendedScore).toFixed(1) 
    : movieData?.tmdbRating || "—"; 

  const subtitleMeta = [ 
    movieData?.type || (category ? category.toUpperCase() : "MOVIE"), 
    movieData?.genres, 
    movieData?.year, 
  ] 
    .filter(Boolean) 
    .join(" · "); 

  const experienceHeading = isPrint 
    ? "What it's actually like to read" 
    : "What it's actually like to watch"; 

  return ( 
    <div className="flex flex-col md:flex-row items-start gap-10 lg:gap-12"> 
      <div className="shrink-0 hidden md:block w-[300px] lg:w-[320px]"> 
        <div className="relative aspect-[2/3] w-full rounded-[14px] border border-[#1E262F] overflow-hidden bg-[#0B0F13] shadow-2xl group"> 
          <img 
            src={movieData.poster} 
            alt={movieData.title} 
            referrerPolicy="no-referrer" 
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500" 
          /> 
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" /> 
        </div> 
      </div> 

      <div className="flex-1 flex flex-col min-w-0"> 
        <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#61F1AC] mb-2 flex items-center gap-2"> 
          <span>ORGI ONE · THE QUICK VERDICT</span> 
        </div> 

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F5F5F5] uppercase mb-2"> 
          {movieData.title} 
        </h1> 

        <div className="text-sm text-[#9CA3AF] font-normal mb-5"> 
          {subtitleMeta} 
        </div> 

        <div className="flex items-center gap-4 mb-5"> 
          <div className="w-13 h-13 rounded-full border-2 border-[#61F1AC] flex items-center justify-center shrink-0"> 
            <span className="text-[#F5F5F5] font-bold text-base tracking-tight"> 
              {scoreDisplay} 
            </span> 
          </div> 
          <div className="flex flex-col"> 
            <span className="text-sm font-semibold text-[#F5F5F5]"> 
              {verdictData?.worthItHeadline || "Worth your time?"} 
            </span> 
            <p className="text-xs sm:text-[13px] text-[#9CA3AF] leading-relaxed mt-0.5 max-w-xl"> 
              {verdictData?.verdict || movieData?.synopsis?.slice(0, 160) + "..."} 
            </p> 
          </div> 
        </div> 

        <div className="rounded-[14px] bg-[#0D1217]/90 border border-[#1E262F] p-4 sm:p-5 flex flex-col gap-3.5 mb-5 max-w-2xl"> 
          <div className="flex items-start gap-3"> 
            <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center text-black shrink-0 mt-0.5"> 
              <Check size={12} strokeWidth={3} /> 
            </div> 
            <div className="flex flex-col"> 
              <span className="text-[13px] font-semibold text-[#F3F4F6]"> 
                You'll probably enjoy it if... 
              </span> 
              <span className="text-xs text-[#9CA3AF] leading-relaxed mt-0.5"> 
                {verdictData?.enjoyIf || "You appreciate thoughtful storytelling and deep characters."} 
              </span> 
            </div> 
          </div> 

          <div className="border-t border-[#1E262F]/70" /> 

          <div className="flex items-start gap-3"> 
            <div className="w-5 h-5 rounded-full bg-[#1E2630] border border-[#2D3748] flex items-center justify-center text-[#9CA3AF] shrink-0 mt-0.5"> 
              <Minus size={12} strokeWidth={2.5} /> 
            </div> 
            <div className="flex flex-col"> 
              <span className="text-[13px] font-semibold text-[#F3F4F6]"> 
                You might not enjoy it if... 
              </span> 
              <span className="text-xs text-[#9CA3AF] leading-relaxed mt-0.5"> 
                {verdictData?.skipIf || "You are looking for instant gratification without patient setup."} 
              </span> 
            </div> 
          </div> 
        </div> 

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 max-w-2xl"> 
          <div className="flex flex-col"> 
            <span className="text-xs font-semibold text-[#F3F4F6] mb-1"> 
              {experienceHeading} 
            </span> 
            <p className="text-xs text-[#9CA3AF] leading-relaxed"> 
              {verdictData?.experience || movieData?.synopsis || "Compelling pacing with standout atmospheric delivery."} 
            </p> 
          </div> 
          <div className="flex flex-col md:border-l md:border-[#1E262F] md:pl-5"> 
            <span className="text-xs font-semibold text-[#F3F4F6] mb-1"> 
              One thing to know 
            </span> 
            <p className="text-xs text-[#9CA3AF] leading-relaxed"> 
              {verdictData?.keyNote || "Best experienced when given undivided attention across sessions."} 
            </p> 
          </div> 
        </div> 

        <div className="flex items-center gap-3 mb-5"> 
          {!category && ( 
            <button 
              type="button" 
              disabled={isLoadingTrailer} 
              onClick={onPlayTrailer} 
              className="px-5 py-2.5 rounded-[10px] bg-[#61F1AC] hover:bg-[#61F1AC]/90 text-black font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#61F1AC]/10" 
            > 
              <Play size={14} className="fill-black text-black" /> 
              <span>{isLoadingTrailer ? "Loading..." : "Start watching"}</span> 
            </button> 
          )} 

          <button 
            type="button" 
            onClick={onOpenReviews} 
            className="px-4 py-2.5 rounded-[10px] border border-[#232D38] bg-[#0E1318] hover:border-[#61F1AC]/50 hover:bg-[#141A20] text-[#F3F4F6] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer" 
          > 
            <Star size={14} className="text-[#61F1AC]" /> 
            <span>Rate</span> 
          </button> 

          <button 
            type="button" 
            aria-label={inCollection ? "Remove from collection" : "Add to collection"} 
            disabled={collectionLoading} 
            onClick={onToggleCollection} 
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${ 
              inCollection 
                ? "border-[#61F1AC]/50 text-[#61F1AC] bg-[#61F1AC]/10" 
                : "border-[#232D38] bg-[#0E1318] text-[#9CA3AF] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50" 
            }`} 
          > 
            <Bookmark size={14} className={inCollection ? "fill-[#61F1AC]" : ""} /> 
          </button> 

          <button 
            type="button" 
            aria-label="Share" 
            onClick={onShare} 
            className="w-9 h-9 rounded-full border border-[#232D38] bg-[#0E1318] flex items-center justify-center text-[#9CA3AF] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50 transition-colors cursor-pointer" 
          > 
            <Share2 size={14} /> 
          </button> 
        </div> 

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#9CA3AF] pt-1"> 
          <div className="flex items-center gap-1.5"> 
            <Star size={13} className="text-[#61F1AC] fill-[#61F1AC]" /> 
            <span>{scoreDisplay}/10</span> 
            {totalVotesLabel && <span>({totalVotesLabel})</span>} 
          </div> 
          <span>·</span> 
          <div className="flex items-center gap-1.5"> 
            {isPrint ? <BookOpen size={13} /> : <Film size={13} />} 
            <span>{movieData?.runtime || (isPrint ? "Serialized" : "Feature")}</span> 
          </div> 
          {movieData?.genres && ( 
            <> 
              <span>·</span> 
              <div className="flex items-center gap-1.5"> 
                <Tag size={13} /> 
                <span>{movieData.genres}</span> 
              </div> 
            </> 
          )} 
        </div> 
      </div> 
    </div> 
  ); 
} 
