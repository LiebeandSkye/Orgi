import React, { useState, useEffect } from "react"; 
import { StepMediumSelector } from "../feature/recommendation/components/StepMediumSelector"; 
import { StepMoodQuestions } from "../feature/recommendation/components/StepMoodQuestions"; 
import { StepPicksResults } from "../feature/recommendation/components/StepPicksResults"; 
import { MediaQuickSummaryModal } from "../feature/recommendation/components/MediaQuickSummaryModal"; 
import { fetchOrgiPicks } from "../feature/recommendation/services/recommendationService"; 
import { LoadingState } from "../components/ui/LoadingState"; 
import { Sparkles } from "lucide-react"; 

const GENERATING_STEPS = [ 
  "Understanding your taste & evening context...", 
  "Consulting cinematic & literary archives...", 
  "Analyzing emotional payoff & pacing curves...", 
  "Generating AI verdicts & curating your top 3 picks...", 
]; 

export function RecommendationPage() { 
  const [step, setStep] = useState(1); 
  const [slideDirection, setSlideDirection] = useState("right"); 
  const [medium, setMedium] = useState("movie"); 
  const [subMedium, setSubMedium] = useState("movie"); 
  const [answers, setAnswers] = useState({ 
    vibes: ["Relaxed"], 
    social: "justMe", 
    time: "90-120", 
    depth: "deep", 
    includeGenres: [], 
    excludedGenres: [], 
  }); 
  const [picks, setPicks] = useState([]); 
  const [isLoading, setIsLoading] = useState(false); 
  const [loadingStepIndex, setLoadingStepIndex] = useState(0); 
  const [selectedModalItem, setSelectedModalItem] = useState(null); 

  useEffect(() => { 
    if (!isLoading) return; 
    const interval = setInterval(() => { 
      setLoadingStepIndex((prev) => (prev + 1) % GENERATING_STEPS.length); 
    }, 750); 
    return () => clearInterval(interval); 
  }, [isLoading]); 

  const handleSelectMedium = (m) => { 
    setMedium(m); 
    setSubMedium(m === "book" ? "manga" : "movie"); 
  }; 

  const handleToggleVibe = (vibe) => { 
    setAnswers((prev) => { 
      const exists = prev.vibes.includes(vibe); 
      const updated = exists 
        ? prev.vibes.filter((v) => v !== vibe) 
        : [...prev.vibes, vibe]; 
      return { ...prev, vibes: updated.length > 0 ? updated : [vibe] }; 
    }); 
  }; 

  const handleSelectOption = (key, value) => { 
    setAnswers((prev) => ({ ...prev, [key]: value })); 
  }; 

  const handleGoToStep = (targetStep, direction = "right") => { 
    setSlideDirection(direction); 
    setStep(targetStep); 
  }; 

  const handleSubmit = async () => { 
    setIsLoading(true); 
    setLoadingStepIndex(0); 
    const startTime = Date.now(); 
    try { 
      const effectiveSubMedium = answers.time === "episodes" && medium === "movie" ? "series" : subMedium; 
      const results = await fetchOrgiPicks({ 
        medium, 
        subMedium: effectiveSubMedium, 
        vibes: answers.vibes, 
        socialContext: answers.social, 
        timeBudget: answers.time, 
        _storyDepth: answers.depth, 
        includeGenres: answers.includeGenres || [], 
        excludedGenres: answers.excludedGenres || [], 
      }); 

      const elapsed = Date.now() - startTime; 
      if (elapsed < 2200) { 
        await new Promise((resolve) => setTimeout(resolve, 2200 - elapsed)); 
      } 

      setPicks(results); 
      handleGoToStep(3, "right"); 
    } catch { 
      setPicks([]); 
      handleGoToStep(3, "right"); 
    } finally { 
      setIsLoading(false); 
    } 
  }; 

  const progressPercentage = isLoading 
    ? 90 
    : step === 1 
    ? 33 
    : step === 2 
    ? 66 
    : 100; 

  const slideClass = slideDirection === "right" ? "animate-slide-in-right" : "animate-slide-in-left"; 

  return ( 
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] flex flex-col justify-between select-none"> 
      <div className="w-full h-1 bg-[#161D24] overflow-hidden sticky top-0 z-30"> 
        <div 
          className="h-full bg-gradient-to-r from-[#61F1AC] via-[#A7F3D0] to-[#61F1AC] transition-all duration-500 ease-out shadow-[0_0_12px_#61F1AC]" 
          style={{ width: `${progressPercentage}%` }} 
        /> 
      </div> 

      <main className="max-w-[1440px] w-full mx-auto px-6 lg:px-[120px] py-8 flex-1 flex flex-col justify-center"> 
        {isLoading ? ( 
          <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in duration-300"> 
            <div className="w-14 h-14 rounded-2xl bg-[#0B0F13] border border-[#61F1AC]/40 flex items-center justify-center text-[#61F1AC] shadow-[0_0_30px_rgba(97,241,172,0.25)] mb-6 animate-pulse"> 
              <Sparkles size={24} /> 
            </div> 
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F5] mb-2"> 
              Curating your{" "} 
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]"> 
                top 3 picks 
              </span> 
            </h2> 
            <p className="text-xs text-[#7A7A7A] mb-8"> 
              Matching against TMDB &amp; MangaDex with AI critique 
            </p> 

            <div className="p-4 rounded-2xl bg-[#0B0F13] border border-[#1E262F] shadow-2xl"> 
              <LoadingState 
                label={GENERATING_STEPS[loadingStepIndex]} 
                variant="Drive" 
              /> 
            </div> 
          </div> 
        ) : ( 
          <div key={`step-${step}`} className={slideClass}> 
            {step === 1 && ( 
              <StepMediumSelector 
                medium={medium} 
                onSelectMedium={handleSelectMedium} 
                onNext={() => handleGoToStep(2, "right")} 
              /> 
            )} 

            {step === 2 && ( 
              <StepMoodQuestions 
                medium={medium} 
                answers={answers} 
                onToggleVibe={handleToggleVibe} 
                onSelectOption={handleSelectOption} 
                onBack={() => handleGoToStep(1, "left")} 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
              /> 
            )} 

            {step === 3 && ( 
              <StepPicksResults 
                medium={medium} 
                picks={picks} 
                vibes={answers.vibes} 
                answers={answers} 
                onSelectPick={(item) => setSelectedModalItem(item)} 
                onRefine={() => handleGoToStep(2, "left")} 
              /> 
            )} 
          </div> 
        )} 
      </main> 

      <MediaQuickSummaryModal 
        item={selectedModalItem} 
        isOpen={Boolean(selectedModalItem)} 
        onClose={() => setSelectedModalItem(null)} 
      /> 
    </div> 
  ); 
} 
export default RecommendationPage; 
