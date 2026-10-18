import React, { useState, useEffect } from "react"; 
import { Sparkles } from "lucide-react"; 
import { LoadingState } from "./LoadingState"; 

const LOADING_STEPS = [
  "Understanding the storyline & premise...",
  "Absorbing narrative baseline & opening hooks...",
  "Analyzing narrative themes, pacing & tone...",
  "Deconstructing character arcs & motivations...",
  "Evaluating ensemble chemistry & performance depth...",
  "Scrutinizing dialogue authenticity & subtext...",
  "Examining world-building & lore consistency...",
  "Dissecting visual language, framing & color grading...",
  "Assessing sound design, score & atmospheric weight...",
  "Tracking narrative momentum across act breaks...",
  "Checking thematic coherence & underlying metaphors...",
  "Evaluating pacing efficiency against runtime...",
  "Stress-testing plot logic & resolving conveniences...",
  "Measuring emotional resonance & third-act payoff...",
  "Assessing genre conventions & intentional subversions...",
  "Cross-referencing comparable titles & stylistic influences...",
  "Factoring in critical reception & audience sentiment...",
  "Benchmarking accessibility for casual viewers vs. superfans...",
  "Calculating bingeability, rewatch value & viewing mood...",
  "Evaluating audience match & key takeaways...",
  "Isolating major strengths & glaring shortcomings...",
  "Determining the definitive target viewer...",
  "Distilling standout moments & memorable highlights...",
  "Formulating the balanced critical perspective...",
  "Synthesizing the quick verdict...",
  "Polishing final recommendation & breakdown...",
]; 

export function AiVerdictSkeleton({ movieData, cropHero, category }) { 
  const [stepIndex, setStepIndex] = useState(() => 
    Math.floor(Math.random() * LOADING_STEPS.length) 
  ); 

  useEffect(() => { 
    const interval = setInterval(() => { 
      setStepIndex((prev) => { 
        let next = Math.floor(Math.random() * LOADING_STEPS.length); 
        if (next === prev) { 
          next = (next + 1) % LOADING_STEPS.length; 
        } 
        return next; 
      }); 
    }, 1800); 

    return () => clearInterval(interval); 
  }, []); 

  const subtitleMeta = [ 
    movieData?.type || (category ? category.toUpperCase() : "MOVIE"), 
    movieData?.genres, 
    movieData?.year, 
  ] 
    .filter(Boolean) 
    .join(" · "); 

  return ( 
    <div 
      className={`relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-10 pb-8 flex items-start gap-10 lg:gap-12 transition-transform duration-500 ${ 
        cropHero 
          ? "-translate-y-48 opacity-100 pointer-events-none" 
          : "translate-y-0 opacity-100" 
      }`} 
    > 
      <div className="shrink-0 hidden md:block w-[300px] lg:w-[320px]"> 
        <div className="relative aspect-[2/3] w-full rounded-[14px] border border-[#1E262F] overflow-hidden bg-[#0B0F13] shadow-2xl"> 
          <img 
            src={movieData.poster} 
            alt={movieData.title} 
            referrerPolicy="no-referrer" 
            className="w-full h-full object-cover object-center" 
          /> 
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" /> 
        </div> 
      </div> 

      <div className="flex-1 flex flex-col min-w-0"> 
        <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#61F1AC] mb-2 flex items-center gap-2"> 
          <Sparkles size={13} className="text-[#61F1AC] animate-pulse" /> 
          <span>ORGI ONE · GENERATING QUICK VERDICT</span> 
        </div> 

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F5F5F5] uppercase mb-2"> 
          {movieData.title} 
        </h1> 

        <div className="text-sm text-[#9CA3AF] font-normal mb-5"> 
          {subtitleMeta} 
        </div> 

        <div className="rounded-[14px] bg-[#0D1217]/90 border border-[#1E262F] p-4 sm:p-5 flex items-center justify-between gap-4 mb-5 max-w-2xl shadow-xl shadow-black/40"> 
          <LoadingState 
            label={LOADING_STEPS[stepIndex]} 
            variant="Drive" 
          /> 
          <div className="hidden sm:flex items-center gap-2 shrink-0"> 
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#61F1AC]/80"> 
              Gemini AI 
            </span> 
          </div> 
        </div> 

        <div className="rounded-[14px] bg-[#0D1217]/50 border border-[#1E262F]/60 p-4 sm:p-5 flex flex-col gap-3.5 mb-5 max-w-2xl animate-pulse"> 
          <div className="h-4 w-3/4 rounded bg-[#161D24]" /> 
          <div className="border-t border-[#1E262F]/40" /> 
          <div className="h-4 w-2/3 rounded bg-[#161D24]" /> 
        </div> 

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 max-w-2xl animate-pulse"> 
          <div className="flex flex-col gap-2"> 
            <div className="h-3.5 w-32 rounded bg-[#161D24]" /> 
            <div className="h-10 rounded bg-[#161D24]" /> 
          </div> 
          <div className="flex flex-col gap-2 md:border-l md:border-[#1E262F]/60 md:pl-5"> 
            <div className="h-3.5 w-28 rounded bg-[#161D24]" /> 
            <div className="h-10 rounded bg-[#161D24]" /> 
          </div> 
        </div> 

        <div className="flex items-center gap-3"> 
          <div className="h-10 w-36 rounded-[10px] bg-[#161D24] animate-pulse" /> 
          <div className="h-10 w-24 rounded-[10px] bg-[#161D24] animate-pulse" /> 
          <div className="w-9 h-9 rounded-full bg-[#161D24] animate-pulse" /> 
          <div className="w-9 h-9 rounded-full bg-[#161D24] animate-pulse" /> 
        </div> 
      </div> 
    </div> 
  ); 
} 
