import React, { useState } from "react"; 
import { 
  User, Users, Heart, Home, ArrowLeft, ChevronDown, Sparkles, 
  Smile, Zap, Brain, Flame, Laugh, Moon, Sun, Compass, Eye, ShieldAlert, Coffee, Bed, Bus, BookMarked, 
  Check 
} from "lucide-react"; 

const MOVIE_VIBES_INITIAL = [ 
  { id: "Relaxed", label: "Relaxed", icon: Coffee }, 
  { id: "Exciting", label: "Exciting", icon: Zap }, 
  { id: "Thought-provoking", label: "Thought-provoking", icon: Brain }, 
  { id: "Emotional", label: "Emotional", icon: Heart }, 
  { id: "Funny", label: "Funny", icon: Laugh }, 
  { id: "Dark & Intense", label: "Dark & intense", icon: Moon }, 
  { id: "Feel-good", label: "Feel-good", icon: Sun }, 
]; 

const MOVIE_VIBES_EXTRA = [ 
  { id: "Suspenseful", label: "Suspenseful", icon: ShieldAlert }, 
  { id: "Whimsical", label: "Whimsical", icon: Compass }, 
  { id: "Mind-bending", label: "Mind-bending", icon: Eye }, 
  { id: "Romantic", label: "Romantic", icon: Flame }, 
  { id: "Cozy", label: "Cozy", icon: Smile }, 
]; 

const BOOK_VIBES_INITIAL = [ 
  { id: "Relaxed", label: "Relaxing slice of life", icon: Coffee }, 
  { id: "Exciting", label: "Action-packed page turner", icon: Zap }, 
  { id: "Thought-provoking", label: "Intricate psychological", icon: Brain }, 
  { id: "Emotional", label: "Deep romantic drama", icon: Heart }, 
  { id: "Funny", label: "Witty & comedic", icon: Laugh }, 
  { id: "Dark & Intense", label: "Dark mystery / horror", icon: Moon }, 
  { id: "Feel-good", label: "Heartwarming fantasy", icon: Sun }, 
]; 

const BOOK_VIBES_EXTRA = [ 
  { id: "Suspenseful", label: "Edge-of-your-seat thriller", icon: ShieldAlert }, 
  { id: "Whimsical", label: "Mythic world-building", icon: Compass }, 
  { id: "Mind-bending", label: "Time-loop / plot twists", icon: Eye }, 
  { id: "Romantic", label: "Slow burn romance", icon: Flame }, 
  { id: "Cozy", label: "Low-conflict comfort read", icon: Smile }, 
]; 

const MOVIE_SOCIAL = [ 
  { id: "justMe", label: "Just me", subtitle: "Solo immersion", icon: User }, 
  { id: "partner", label: "With partner", subtitle: "Date night pick", icon: Heart }, 
  { id: "friends", label: "With friends", subtitle: "High group energy", icon: Users }, 
  { id: "family", label: "With family", subtitle: "All-ages friendly", icon: Home }, 
]; 

const BOOK_SETTING = [ 
  { id: "bed", label: "Solo in bed", subtitle: "Wind down reading", icon: Bed }, 
  { id: "commute", label: "Daily commute", subtitle: "Bite-sized chapters", icon: Bus }, 
  { id: "cafe", label: "Cozy cafe", subtitle: "Deep reading flow", icon: Coffee }, 
  { id: "break", label: "Study / quick break", subtitle: "Light refresh", icon: BookMarked }, 
]; 

const MOVIE_CHECKPOINTS = [ 
  { id: "under90", label: "Under 90 min", sub: "Quick watch", pct: 15 }, 
  { id: "90-120", label: "90–120 min", sub: "Standard film", pct: 45 }, 
  { id: "2plus", label: "2+ hours", sub: "Immersive epic", pct: 75 }, 
  { id: "episodes", label: "A few episodes", sub: "Series / Anime", pct: 100 }, 
]; 

const BOOK_CHECKPOINTS = [ 
  { id: "under90", label: "Short one-shot", sub: "Under 1 hr", pct: 15 }, 
  { id: "90-120", label: "Quick arc", sub: "Few chapters", pct: 45 }, 
  { id: "2plus", label: "Medium volume", sub: "Full tankōbon", pct: 75 }, 
  { id: "episodes", label: "Epic multi-volume", sub: "Long haul saga", pct: 100 }, 
]; 

const MOVIE_EXPERIENCES = [ 
  { id: "deep", title: "Mind-bending & layered", desc: "Complex plots, puzzles, and rewarding depth" }, 
  { id: "easy", title: "Pure dopamine & laughter", desc: "High entertainment, zero emotional friction" }, 
  { id: "unexpected", title: "Emotional catharsis", desc: "Tear-jerkers, poignant character resonance" }, 
  { id: "cozy", title: "Cozy comfort & escape", desc: "Gentle atmosphere, easy to melt into" }, 
]; 

const BOOK_EXPERIENCES = [ 
  { id: "deep", title: "Intricate world-building", desc: "Expansive lore, strategic depth, rich systems" }, 
  { id: "easy", title: "Fast bingeable hooks", desc: "Cliffhangers every chapter, non-stop flow" }, 
  { id: "unexpected", title: "Unpredictable plot twists", desc: "Unreliable narrators, unexpected shocks" }, 
  { id: "cozy", title: "Wholesome healing slice", desc: "Comforting daily routines, heartfelt warmth" }, 
]; 

const PREFERRED_GENRES_MOVIE = [ 
  { id: "Animation", label: "Animation / Anime" }, 
  { id: "Romance", label: "Romance" }, 
  { id: "Sci-Fi", label: "Sci-Fi" }, 
  { id: "Action", label: "Action" }, 
  { id: "Comedy", label: "Comedy" }, 
  { id: "Drama", label: "Drama" }, 
  { id: "Fantasy", label: "Fantasy" }, 
  { id: "Mystery", label: "Mystery" }, 
]; 

const PREFERRED_GENRES_BOOK = [ 
  { id: "Romance", label: "Romance" }, 
  { id: "Fantasy", label: "Fantasy" }, 
  { id: "Action", label: "Action" }, 
  { id: "Comedy", label: "Comedy" }, 
  { id: "Drama", label: "Drama" }, 
  { id: "Mystery", label: "Mystery" }, 
  { id: "Slice of Life", label: "Slice of Life" }, 
  { id: "Isekai", label: "Isekai" }, 
]; 

const AVOID_GENRES_MOVIE = [ 
  { id: "27", label: "Horror" }, 
  { id: "80", label: "Crime" }, 
]; 

const AVOID_GENRES_BOOK = [ 
  { id: "Horror", label: "Horror" }, 
  { id: "Crime", label: "Crime" }, 
]; 

export function StepMoodQuestions({ 
  medium, 
  answers, 
  onToggleVibe, 
  onSelectOption, 
  onBack, 
  onSubmit, 
  isLoading, 
}) { 
  const [showMoreVibes, setShowMoreVibes] = useState(false); 
  const [fineTuneOpen, setFineTuneOpen] = useState(false); 

  const isBook = medium === "book"; 
  const initialVibes = isBook ? BOOK_VIBES_INITIAL : MOVIE_VIBES_INITIAL; 
  const extraVibes = isBook ? BOOK_VIBES_EXTRA : MOVIE_VIBES_EXTRA; 
  const allVibes = showMoreVibes ? [...initialVibes, ...extraVibes] : initialVibes; 
  const partnerOptions = isBook ? BOOK_SETTING : MOVIE_SOCIAL; 
  const checkpoints = isBook ? BOOK_CHECKPOINTS : MOVIE_CHECKPOINTS; 
  const experienceOptions = isBook ? BOOK_EXPERIENCES : MOVIE_EXPERIENCES; 
  const preferredGenreList = isBook ? PREFERRED_GENRES_BOOK : PREFERRED_GENRES_MOVIE; 
  const avoidList = isBook ? AVOID_GENRES_BOOK : AVOID_GENRES_MOVIE; 

  const activeCheckpoint = checkpoints.find((c) => c.id === answers.time) || checkpoints[1]; 

  const handleToggleIncludeGenre = (genreId) => { 
    const current = answers.includeGenres || []; 
    const exists = current.includes(genreId); 
    const updated = exists 
      ? current.filter((g) => g !== genreId) 
      : [...current, genreId]; 
    onSelectOption("includeGenres", updated); 
  }; 

  const handleToggleExcludeGenre = (genreId) => { 
    const current = answers.excludedGenres || []; 
    const exists = current.includes(genreId); 
    const updated = exists 
      ? current.filter((g) => g !== genreId) 
      : [...current, genreId]; 
    onSelectOption("excludedGenres", updated); 
  }; 

  return ( 
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto py-4"> 
      <div className="lg:col-span-5 flex flex-col justify-between"> 
        <div> 
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#F5F5F5] leading-snug mb-3"> 
            Tell us what you're{" "} 
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]"> 
              in the mood for 
            </span> 
          </h2> 
          <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed mb-6"> 
            Pick one or more vibes to set the tone for tonight. 
          </p> 

          <div className="grid grid-cols-2 gap-2 mb-3"> 
            {allVibes.map((v) => { 
              const Icon = v.icon; 
              const active = answers.vibes.includes(v.id); 
              return ( 
                <button 
                  key={v.id} 
                  type="button" 
                  onClick={() => onToggleVibe(v.id)} 
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${ 
                    active 
                      ? "bg-[#61F1AC]/15 border-[#61F1AC] text-[#61F1AC] font-semibold shadow-[0_0_15px_rgba(97,241,172,0.12)]" 
                      : "bg-[#0B0F13] border-[#1E262F] text-[#9CA3AF] hover:text-white hover:border-white/20" 
                  }`} 
                > 
                  <div className="flex items-center gap-2 truncate"> 
                    <Icon size={14} className="shrink-0" /> 
                    <span className="truncate">{v.label}</span> 
                  </div> 
                  {active && <Check size={12} className="shrink-0 stroke-[3]" />} 
                </button> 
              ); 
            })} 
          </div> 

          <button 
            type="button" 
            onClick={() => setShowMoreVibes((p) => !p)} 
            className="text-xs text-[#61F1AC] hover:underline font-medium cursor-pointer" 
          > 
            {showMoreVibes ? "− Show fewer vibes" : "+ Show more options"} 
          </button> 
        </div> 

        <div className="pt-8 hidden lg:flex items-center gap-2"> 
          <svg className="w-8 h-8 text-[#61F1AC] rotate-45" viewBox="0 0 40 40" fill="none"> 
            <path d="M5 25 C 10 10, 25 15, 32 5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" /> 
            <path d="M25 5 L 32 5 L 30 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> 
          </svg> 
          <span className="text-xs text-[#7A7A7A] italic"> 
            The more you share, the better the results. 
          </span> 
        </div> 
      </div> 

      <div className="lg:col-span-7 rounded-3xl bg-[#0B0F13] border border-[#1E262F] p-6 sm:p-8 flex flex-col gap-7 shadow-2xl"> 
        <div className="pb-6 border-b border-[#1E262F]"> 
          <label className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider mb-1 flex items-center gap-2"> 
            <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC]" /> 
            <span>1. {isBook ? "Where are you reading?" : "Who's watching?"}</span> 
          </label> 
          <span className="text-[11px] text-[#7A7A7A] block mb-3">Select your environment or companions.</span> 

          <div className="grid grid-cols-2 gap-3"> 
            {partnerOptions.map((opt) => { 
              const Icon = opt.icon; 
              const active = answers.social === opt.id; 
              return ( 
                <button 
                  key={opt.id} 
                  type="button" 
                  onClick={() => onSelectOption("social", opt.id)} 
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${ 
                    active 
                      ? "bg-[#61F1AC]/15 border-[#61F1AC] text-[#61F1AC] shadow-[0_0_15px_rgba(97,241,172,0.1)]" 
                      : "bg-black/40 border-[#1E262F] text-[#9CA3AF] hover:text-white hover:border-white/20" 
                  }`} 
                > 
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${ 
                    active ? "border-[#61F1AC]/50 bg-[#61F1AC]/20 text-[#61F1AC]" : "border-[#1E262F] bg-black text-[#7A7A7A]" 
                  }`}> 
                    <Icon size={16} /> 
                  </div> 
                  <div className="min-w-0"> 
                    <div className={`text-xs font-semibold ${active ? "text-[#61F1AC]" : "text-[#F5F5F5]"}`}> 
                      {opt.label} 
                    </div> 
                    <div className="text-[10px] text-[#7A7A7A] truncate"> 
                      {opt.subtitle} 
                    </div> 
                  </div> 
                </button> 
              ); 
            })} 
          </div> 
        </div> 

        <div className="pb-6 border-b border-[#1E262F]"> 
          <div className="flex items-center justify-between mb-2"> 
            <label className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2"> 
              <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC]" /> 
              <span>2. {isBook ? "How long do you want to read?" : "How much time do you have?"}</span> 
            </label> 
            <span className="text-xs font-mono text-[#61F1AC] font-semibold"> 
              {activeCheckpoint.label} 
            </span> 
          </div> 
          <span className="text-[11px] text-[#7A7A7A] block mb-6">Interactive time roadmap: tap checkpoints to set duration.</span> 

          <div className="relative pt-6 pb-2 px-3"> 
            <div className="relative w-full h-2 rounded-full bg-[#161D24] overflow-hidden"> 
              <div 
                className="h-full bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0] transition-all duration-300" 
                style={{ width: `${activeCheckpoint.pct}%` }} 
              /> 
            </div> 

            <div className="absolute top-0 inset-x-3 flex justify-between"> 
              {checkpoints.map((cp) => { 
                const isSelected = answers.time === cp.id; 
                return ( 
                  <button 
                    key={cp.id} 
                    type="button" 
                    onClick={() => onSelectOption("time", cp.id)} 
                    className="group flex flex-col items-center cursor-pointer -translate-y-2" 
                  > 
                    <div className="text-[10px] sm:text-xs font-semibold mb-2 text-[#9CA3AF] group-hover:text-white transition-colors"> 
                      {cp.label} 
                    </div> 
                    <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${ 
                      isSelected 
                        ? "border-[#61F1AC] bg-black shadow-[0_0_12px_#61F1AC] scale-125" 
                        : "border-[#2A3441] bg-[#161D24] group-hover:border-white/60" 
                    }`}> 
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#61F1AC]" />} 
                    </div> 
                    <div className="text-[9px] text-[#7A7A7A] mt-1.5 hidden sm:block"> 
                      {cp.sub} 
                    </div> 
                  </button> 
                ); 
              })} 
            </div> 
          </div> 
        </div> 

        <div> 
          <label className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider mb-1 flex items-center gap-2"> 
            <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC]" /> 
            <span>3. What kind of experience do you want?</span> 
          </label> 
          <span className="text-[11px] text-[#7A7A7A] block mb-3">Choose the narrative payoff and rhythm.</span> 

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> 
            {experienceOptions.map((opt) => { 
              const active = answers.depth === opt.id; 
              return ( 
                <button 
                  key={opt.id} 
                  type="button" 
                  onClick={() => onSelectOption("depth", opt.id)} 
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${ 
                    active 
                      ? "bg-[#61F1AC]/10 border-[#61F1AC] shadow-[0_0_20px_rgba(97,241,172,0.12)]" 
                      : "bg-black/40 border-[#1E262F] hover:border-white/20" 
                  }`} 
                > 
                  <div className={`text-xs font-semibold ${active ? "text-[#61F1AC]" : "text-[#F5F5F5]"}`}> 
                    {opt.title} 
                  </div> 
                  <div className="text-[11px] text-[#7A7A7A] leading-relaxed"> 
                    {opt.desc} 
                  </div> 
                </button> 
              ); 
            })} 
          </div> 
        </div> 

        <div className="pt-1"> 
          <button 
            type="button" 
            onClick={() => setFineTuneOpen((p) => !p)} 
            className="flex items-center gap-2 text-xs text-[#7A7A7A] hover:text-[#9CA3AF] transition-colors cursor-pointer" 
          > 
            <ChevronDown size={14} className={`transition-transform duration-300 ${fineTuneOpen ? "rotate-180" : ""}`} /> 
            <span>Fine-tune genres &amp; preferences</span> 
          </button> 

          {fineTuneOpen && ( 
            <div className="mt-3 p-4 rounded-2xl bg-black/60 border border-[#1E262F] text-xs text-[#9CA3AF] space-y-4"> 
              <div> 
                <div className="mb-2 text-[11px] font-semibold text-[#61F1AC] uppercase tracking-wider"> 
                  Prefer / Lean towards genres: 
                </div> 
                <div className="flex flex-wrap gap-2.5"> 
                  {preferredGenreList.map((genre) => { 
                    const isChecked = (answers.includeGenres || []).includes(genre.id); 
                    return ( 
                      <button 
                        key={genre.id} 
                        type="button" 
                        onClick={() => handleToggleIncludeGenre(genre.id)} 
                        className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${ 
                          isChecked 
                            ? "bg-[#61F1AC]/20 border-[#61F1AC] text-[#61F1AC] font-semibold" 
                            : "bg-[#0B0F13] border-[#1E262F] text-[#9CA3AF] hover:text-white" 
                        }`} 
                      > 
                        {isChecked && <Check size={12} className="stroke-[3]" />} 
                        <span>{genre.label}</span> 
                      </button> 
                    ); 
                  })} 
                </div> 
              </div> 

              <div className="pt-3 border-t border-[#1E262F]/60"> 
                <div className="mb-2 text-[11px] font-semibold text-[#F87171] uppercase tracking-wider"> 
                  Avoid / Exclude genres: 
                </div> 
                <div className="flex flex-wrap gap-2.5"> 
                  {avoidList.map((genre) => { 
                    const isChecked = (answers.excludedGenres || []).includes(genre.id); 
                    return ( 
                      <label key={genre.id} className="flex items-center gap-2 cursor-pointer select-none"> 
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleToggleExcludeGenre(genre.id)} 
                          className="rounded border-[#1E262F] bg-black accent-[#F87171] cursor-pointer" 
                        /> 
                        <span className={isChecked ? "text-[#F87171] font-medium" : "text-[#9CA3AF]"}> 
                          {genre.label} 
                        </span> 
                      </label> 
                    ); 
                  })} 
                </div> 
              </div> 
            </div> 
          )} 
        </div> 

        <div className="flex items-center justify-between pt-6 border-t border-[#1E262F]"> 
          <button 
            type="button" 
            onClick={onBack} 
            className="px-5 py-2.5 rounded-full border border-[#1E262F] text-xs font-medium text-[#9CA3AF] hover:text-white transition-colors cursor-pointer flex items-center gap-2" 
          > 
            <ArrowLeft size={14} /> 
            <span>Back</span> 
          </button> 

          <button 
            type="button" 
            disabled={isLoading || answers.vibes.length === 0} 
            onClick={onSubmit} 
            className="px-7 py-3 rounded-full bg-[#61F1AC] hover:bg-[#52deb0] text-black font-semibold text-xs flex items-center gap-2 shadow-xl shadow-[#61F1AC]/20 hover:shadow-[0_0_25px_rgba(97,241,172,0.35)] transition-all cursor-pointer disabled:opacity-50" 
          > 
            <Sparkles size={14} /> 
            <span>{isLoading ? "Generating AI recommendations..." : "Find my 3 picks →"}</span> 
          </button> 
        </div> 
      </div> 
    </div> 
  ); 
} 
