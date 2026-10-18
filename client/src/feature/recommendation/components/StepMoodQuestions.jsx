import React, { useState } from "react";
import {
  User, Users, Heart, Home, ArrowLeft, ChevronDown, Sparkles,
  Smile, Zap, Brain, Flame, Laugh, Moon, Sun, Compass, Eye, ShieldAlert, Coffee, Bed, Bus, BookMarked,
  Check
} from "lucide-react";
import { TimeCheckpointSlider } from "./TimeCheckpointSlider";

/* ---------- Button animations (self-contained, no extra deps) ---------- */
const BUTTON_ANIMATION_CSS = `
  .btn-bounce {
    transition:
      transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1),
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease,
      box-shadow 0.25s ease,
      opacity 0.2s ease;
  }
  .btn-bounce:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
  .btn-bounce:active:not(:disabled) {
    transform: scale(0.96);
    transition-duration: 0.1s;
  }

  .btn-nudge { transition: color 0.2s ease; }

  /* Small pop when something becomes selected */
  @keyframes btn-pop {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.06); }
    100% { transform: scale(1); }
  }
  .btn-pop { animation: btn-pop 0.3s ease-out; }

  .icon-back { transition: transform 0.25s ease; }
  .btn-back:hover .icon-back { transform: translateX(-3px); }

  @keyframes panel-in {
    0%   { opacity: 0; transform: translateY(-6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .panel-in { animation: panel-in 0.25s ease-out; }

  @keyframes check-in {
    0%   { transform: scale(0); }
    100% { transform: scale(1); }
  }
  .check-in { animation: check-in 0.25s cubic-bezier(0.34, 1.4, 0.64, 1); }

  @media (prefers-reduced-motion: reduce) {
    .btn-bounce, .btn-pop, .panel-in, .check-in {
      animation: none !important;
      transition-duration: 0.01ms !important;
    }
    .btn-bounce:hover { transform: none !important; }
  }
`;

const MOVIE_VIBES_INITIAL = [
  { id: "Relaxed", label: "Relaxed", icon: Coffee },
  { id: "Exciting", label: "Exciting", icon: Zap },
  { id: "Thought-provoking", label: "Deep", icon: Brain },
  { id: "Emotional", label: "Emotional", icon: Heart },
  { id: "Funny", label: "Funny", icon: Laugh },
  { id: "Dark & Intense", label: "Dark", icon: Moon },
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
  { id: "Relaxed", label: "Slice of life", icon: Coffee },
  { id: "Exciting", label: "Action", icon: Zap },
  { id: "Thought-provoking", label: "Psychological", icon: Brain },
  { id: "Emotional", label: "Romance drama", icon: Heart },
  { id: "Funny", label: "Comedy", icon: Laugh },
  { id: "Dark & Intense", label: "Dark", icon: Moon },
  { id: "Feel-good", label: "Heartwarming", icon: Sun },
];

const BOOK_VIBES_EXTRA = [
  { id: "Suspenseful", label: "Thriller", icon: ShieldAlert },
  { id: "Whimsical", label: "World-building", icon: Compass },
  { id: "Mind-bending", label: "Plot twists", icon: Eye },
  { id: "Romantic", label: "Slow burn", icon: Flame },
  { id: "Cozy", label: "Comfort read", icon: Smile },
];

const BOOK_FORMATS = [
  { id: "all", label: "All" },
  { id: "manga", label: "Manga" },
  { id: "manhwa", label: "Manhwa" },
  { id: "manhua", label: "Manhua" },
  { id: "novels", label: "Novels" },
];

const MOVIE_SOCIAL = [
  { id: "justMe", label: "Just me", icon: User },
  { id: "partner", label: "Partner", icon: Heart },
  { id: "friends", label: "Friends", icon: Users },
  { id: "family", label: "Family", icon: Home },
];

const BOOK_SETTING = [
  { id: "bed", label: "In bed", icon: Bed },
  { id: "commute", label: "Commute", icon: Bus },
  { id: "cafe", label: "Cafe", icon: Coffee },
  { id: "break", label: "Quick break", icon: BookMarked },
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
  { id: "episodes", label: "Epic saga", sub: "Multi-volume", pct: 100 },
];

const MOVIE_EXPERIENCES = [
  { id: "deep", title: "Layered & clever" },
  { id: "easy", title: "Fun & easy" },
  { id: "unexpected", title: "Emotional" },
  { id: "cozy", title: "Cozy escape" },
];

const BOOK_EXPERIENCES = [
  { id: "deep", title: "Rich world-building" },
  { id: "easy", title: "Fast & bingeable" },
  { id: "unexpected", title: "Plot twists" },
  { id: "cozy", title: "Wholesome healing" },
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

function SectionTitle({ children, right }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h3 className="text-base font-semibold text-[#F5F5F5]">{children}</h3>
      {right}
    </div>
  );
}

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
    const updated = current.includes(genreId)
      ? current.filter((g) => g !== genreId)
      : [...current, genreId];
    onSelectOption("includeGenres", updated);
  };

  const handleToggleExcludeGenre = (genreId) => {
    const current = answers.excludedGenres || [];
    const updated = current.includes(genreId)
      ? current.filter((g) => g !== genreId)
      : [...current, genreId];
    onSelectOption("excludedGenres", updated);
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <style>{BUTTON_ANIMATION_CSS}</style>

      <h2 className="text-center text-3xl sm:text-4xl font-light tracking-tight text-[#F5F5F5] mb-10">
        What's your{" "}
        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]">
          mood?
        </span>
      </h2>

      <div className="flex flex-col gap-10">
        {/* Book Format Selector */}
        {isBook && (
          <section className="text-center">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#7A7A7A] mb-3">
              Format
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
              {BOOK_FORMATS.map((fmt) => {
                const active = (answers.bookFormat || "all") === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => onSelectOption("bookFormat", fmt.id)}
                    className={`btn-bounce px-5 py-2 rounded-full text-xs sm:text-sm font-medium border cursor-pointer ${
                      active
                        ? "btn-pop bg-[#61F1AC] border-[#61F1AC] text-black font-semibold shadow-[0_0_20px_rgba(97,241,172,0.25)]"
                        : "bg-[#0B0F13] border-[#1E262F] text-[#9CA3AF] hover:text-white hover:border-white/20"
                    }`}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Vibes */}
        <section>
          <div className="flex flex-wrap justify-center gap-3">
            {allVibes.map((v) => {
              const Icon = v.icon;
              const active = answers.vibes.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onToggleVibe(v.id)}
                  className={`btn-bounce px-5 py-3 rounded-full text-sm font-medium border flex items-center gap-2 cursor-pointer ${
                    active
                      ? "btn-pop bg-[#61F1AC] border-[#61F1AC] text-black shadow-[0_0_20px_rgba(97,241,172,0.25)]"
                      : "bg-[#0B0F13] border-[#1E262F] text-[#C5C5C5] hover:text-white hover:border-white/25"
                  }`}
                >
                  <Icon size={16} />
                  {v.label}
                </button>
              );
            })}
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowMoreVibes((p) => !p)}
              className="btn-nudge text-sm text-[#7A7A7A] hover:text-[#61F1AC] cursor-pointer"
            >
              {showMoreVibes ? "Show less" : "More"}
            </button>
          </div>
        </section>

        {/* Who / where */}
        <section>
          <SectionTitle>{isBook ? "Where are you reading?" : "Who's watching?"}</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {partnerOptions.map((opt) => {
              const Icon = opt.icon;
              const active = answers.social === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectOption("social", opt.id)}
                  className={`btn-bounce py-5 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer ${
                    active
                      ? "btn-pop bg-[#61F1AC]/15 border-[#61F1AC] text-[#61F1AC]"
                      : "bg-[#0B0F13] border-[#1E262F] text-[#9CA3AF] hover:text-white hover:border-white/25"
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time */}
        <section>
          <SectionTitle
            right={<span className="text-sm font-semibold text-[#61F1AC]">{activeCheckpoint.label}</span>}
          >
            {isBook ? "How long?" : "How much time?"}
          </SectionTitle>
          <TimeCheckpointSlider
            checkpoints={checkpoints}
            value={answers.time}
            onChange={(val) => onSelectOption("time", val)}
          />
        </section>

        {/* Experience */}
        <section>
          <SectionTitle>What kind of experience?</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {experienceOptions.map((opt) => {
              const active = answers.depth === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectOption("depth", opt.id)}
                  className={`btn-bounce py-4 px-4 rounded-2xl border text-sm font-medium cursor-pointer ${
                    active
                      ? "btn-pop bg-[#61F1AC]/15 border-[#61F1AC] text-[#61F1AC]"
                      : "bg-[#0B0F13] border-[#1E262F] text-[#C5C5C5] hover:text-white hover:border-white/25"
                  }`}
                >
                  {opt.title}
                </button>
              );
            })}
          </div>
        </section>

        {/* Fine-tune (hidden by default) */}
        <section>
          <button
            type="button"
            onClick={() => setFineTuneOpen((p) => !p)}
            className="btn-nudge mx-auto flex items-center gap-2 text-sm text-[#7A7A7A] hover:text-[#C5C5C5] cursor-pointer"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${fineTuneOpen ? "rotate-180" : ""}`}
            />
            Fine-tune genres
          </button>

          {fineTuneOpen && (
            <div className="panel-in mt-5 p-5 rounded-2xl bg-[#0B0F13] border border-[#1E262F] space-y-5">
              <div>
                <div className="mb-3 text-sm font-medium text-[#F5F5F5]">Include</div>
                <div className="flex flex-wrap gap-2">
                  {preferredGenreList.map((genre) => {
                    const isChecked = (answers.includeGenres || []).includes(genre.id);
                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => handleToggleIncludeGenre(genre.id)}
                        className={`btn-bounce px-4 py-2 rounded-full border text-sm flex items-center gap-1.5 cursor-pointer ${
                          isChecked
                            ? "btn-pop bg-[#61F1AC] border-[#61F1AC] text-black font-medium"
                            : "bg-black/40 border-[#1E262F] text-[#9CA3AF] hover:text-white"
                        }`}
                      >
                        {isChecked && <Check size={14} className="check-in stroke-[3]" />}
                        {genre.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-5 border-t border-[#1E262F]">
                <div className="mb-3 text-sm font-medium text-[#F5F5F5]">Avoid</div>
                <div className="flex flex-wrap gap-2">
                  {avoidList.map((genre) => {
                    const isChecked = (answers.excludedGenres || []).includes(genre.id);
                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => handleToggleExcludeGenre(genre.id)}
                        className={`btn-bounce px-4 py-2 rounded-full border text-sm cursor-pointer ${
                          isChecked
                            ? "btn-pop bg-[#F87171]/15 border-[#F87171] text-[#F87171] font-medium"
                            : "bg-black/40 border-[#1E262F] text-[#9CA3AF] hover:text-white"
                        }`}
                      >
                        {genre.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="btn-bounce btn-back px-5 py-3 rounded-full text-sm font-medium text-[#9CA3AF] hover:text-white cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft size={16} className="icon-back" />
            Back
          </button>

          <button
            type="button"
            disabled={isLoading || answers.vibes.length === 0}
            onClick={onSubmit}
            className={`btn-bounce px-8 py-3.5 rounded-full bg-[#61F1AC] hover:bg-[#52deb0] text-black font-semibold text-sm flex items-center gap-2 shadow-xl shadow-[#61F1AC]/20 hover:shadow-[0_0_25px_rgba(97,241,172,0.35)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Sparkles size={16} />
            {isLoading ? "Finding..." : "Find my 3 picks"}
          </button>
        </div>
      </div>
    </div>
  );
}