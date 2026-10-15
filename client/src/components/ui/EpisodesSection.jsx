
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock3,
  Star,
  Plus,
  Check,
  Monitor,
  Tag,
  Play,
  ArrowUpDown,
} from "lucide-react";
import { getSeasonEpisodes } from "../../services/tmdb";


const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";

function getImage(path, size = "w500") {
  return path ? `${TMDB_IMAGE_URL}/${size}${path}` : "";
}

function formatDate(date) {
  if (!date) return "Air date unavailable";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEpisodeNumber(number) {
  return String(number).padStart(2, "0");
}

function getRating(score) {
  return Number(score || 0).toFixed(1);
}

async function tmdbFetch(endpoint, signal) {
   const response = await fetch(`/api/tmdb${endpoint}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `TMDB request failed (${response.status}). Please check your TMDB API configuration.`
    );
  }

  const result = await response.json();

  if (result.success === false) {
    throw new Error(result.message || "Could not load TV series.");
  }

  return result.success === true && result.data
    ? result.data
    : result;
}

// ============================================================
// MAIN COMPONENT
// ============================================================


export default function EpisodesSection({
  seriesId,
  onRateEpisode,
}) {
  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(1);

  const [sortBy, setSortBy] = useState("episode");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [error, setError] = useState("");

  const [savedEpisodes, setSavedEpisodes] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [ratingEpisode, setRatingEpisode] = useState(null);
  const [showRatingPicker, setShowRatingPicker] = useState(false);

  const ratingStripRef = useRef(null);


  // ----------------------------------------------------------
  // 2. FETCH EPISODES WHEN THE SELECTED SEASON CHANGES
  // ---------------------------------------------------------

useEffect(() => {
  if (!seriesId) {
    setError("TV series ID is missing.");
    setLoadingSeries(false);
    return;
  }

  const controller = new AbortController();

  async function loadSeries() {
    setLoadingSeries(true);
    setError("");

    try {
      const data = await tmdbFetch(
        `/tv/${seriesId}?language=en-US`,
        controller.signal
      );

      if (controller.signal.aborted) return;

      setSeries(data);

      const availableSeasons = (data.seasons || []).filter(
        (season) => season.season_number > 0
      );

      setSeasons(availableSeasons);

      setSelectedSeason((current) => {
        if (
          availableSeasons.some(
            (season) => season.season_number === current
          )
        ) {
          return current;
        }

        return availableSeasons[0]?.season_number ?? 1;
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to load TV series details.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingSeries(false);
      }
    }
  }

  loadSeries();

  return () => controller.abort();
}, [seriesId]);



useEffect(() => {
  if (!seriesId || seasons.length === 0) return;

  const controller = new AbortController();

  async function loadSeason() {
    setLoadingEpisodes(true);
    setError("");
    setEpisodes([]);
    setSelectedEpisodeNumber(1);

    try {
      const seasonEpisodes = await getSeasonEpisodes(
        seriesId,
        selectedSeason
      );

      if (controller.signal.aborted) return;

      setEpisodes(
        seasonEpisodes.map((episode) => ({
          ...episode,
          id: episode.id ?? `${selectedSeason}-${episode.episodeNumber ?? episode.number}`,
          episode_number:
            episode.episodeNumber ?? Number(episode.number),
          name: episode.title,
          overview: episode.description,
          runtime: Number.parseInt(episode.runtime, 10) || null,
          vote_average:
            Number.parseFloat(episode.score) || 0,
          still_path: episode.thumbnail
            ? episode.thumbnail.replace(
                "https://image.tmdb.org/t/p/w342",
                ""
              )
            : null,
          air_date: episode.air_date || "",
          vote_count: episode.vote_count || 0,
        }))
      );

      if (seasonEpisodes.length > 0) {
        const firstEpisode = seasonEpisodes[0];

        setSelectedEpisodeNumber(
          firstEpisode.episodeNumber ?? Number(firstEpisode.number)
        );
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Could not load the episodes.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingEpisodes(false);
      }
    }
  }

  loadSeason();

  return () => controller.abort();
}, [seriesId, selectedSeason, seasons.length]);


  // ----------------------------------------------------------
  // 3. DERIVED DATA
  // ----------------------------------------------------------

  const selectedEpisode = useMemo(
    () =>
      episodes.find(
        (episode) => episode.episode_number === selectedEpisodeNumber
      ) || episodes[0],
    [episodes, selectedEpisodeNumber]
  );

  const sortedEpisodes = useMemo(() => {
    const result = [...episodes];

    switch (sortBy) {
      case "rating":
        return result.sort(
          (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
        );

      case "rating-low":
        return result.sort(
          (a, b) => (a.vote_average || 0) - (b.vote_average || 0)
        );

      case "title":
        return result.sort((a, b) => a.name.localeCompare(b.name));

      case "newest":
        return result.sort(
          (a, b) =>
            new Date(b.air_date || 0) - new Date(a.air_date || 0)
        );

      case "episode":
      default:
        return result.sort(
          (a, b) => a.episode_number - b.episode_number
        );
    }
  }, [episodes, sortBy]);

  const seasonAverage = useMemo(() => {
    const rated = episodes.filter((episode) => episode.vote_count > 0);

    if (rated.length === 0) return null;

    return (
      rated.reduce((total, episode) => total + episode.vote_average, 0) /
      rated.length
    );
  }, [episodes]);

  // ----------------------------------------------------------
  // 4. INTERACTIONS
  // ----------------------------------------------------------

  function changeSeason(seasonNumber) {
    setSelectedSeason(seasonNumber);
    setSortDropdownOpen(false);
  }

  function toggleSaved(episodeNumber) {
    setSavedEpisodes((current) =>
      current.includes(episodeNumber)
        ? current.filter((number) => number !== episodeNumber)
        : [...current, episodeNumber]
    );
  }

  function rateEpisode(episodeNumber, rating) {
    setUserRatings((current) => ({
      ...current,
      [`${selectedSeason}-${episodeNumber}`]: rating,
    }));

    if (onRateEpisode) {
      onRateEpisode({
        seriesId,
        seasonNumber: selectedSeason,
        episodeNumber,
        rating,
      });
    }

    setShowRatingPicker(false);
  }

  function scrollRatingStrip(direction) {
    ratingStripRef.current?.scrollBy({
      left: direction * 350,
      behavior: "smooth",
    });
  }

  // ----------------------------------------------------------
  // 5. LOADING AND ERROR STATES
  // ----------------------------------------------------------

  if (loadingSeries) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded bg-[#141414]" />
        <div className="h-24 rounded-xl bg-[#0B0B0B]" />
        <div className="h-64 rounded-xl bg-[#0B0B0B]" />
      </div>
    );
  }

  if (error && !series) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!series) return null;

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <section className="w-full min-w-0 space-y-6 text-[#F5F5F5]">

      {/* ======================================================
          SEASON TABS
      ====================================================== */}

      <div className="flex gap-6 overflow-x-auto border-b border-[#1C1C1C] [scrollbar-width:none]">
        {seasons.map((season) => (
          <button
            key={season.id}
            type="button"
            onClick={() => changeSeason(season.season_number)}
            className={`relative shrink-0 pb-3 text-sm transition ${
              selectedSeason === season.season_number
                ? "font-semibold text-white"
                : "text-[#7A7A7A] hover:text-white"
            }`}
          >
            Season {season.season_number}

            {selectedSeason === season.season_number && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#61F1AC]" />
            )}
          </button>
        ))}
      </div>

      {/* ======================================================
          EPISODE RATING BAR SELECTOR
      ====================================================== */}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#8A8A8A]">
          <span>S{selectedSeason} Episodes</span>
          <span>·</span>

          <span className="inline-flex items-center gap-1 text-[#61F1AC]">
            <Star size={12} fill="currentColor" />
            {seasonAverage === null
              ? "No ratings yet"
              : `${seasonAverage.toFixed(1)} Average`}
          </span>
          

          <span className="text-[#454545]">|</span>

          <span>
            {episodes.reduce(
              (total, episode) => total + (episode.vote_count || 0),
              0
            ).toLocaleString()}{" "}
            episode votes
          </span>
        </div>

        <div className="relative">
          <div
            ref={ratingStripRef}
            className="flex h-[104px] items-end gap-2 overflow-x-auto border-b border-[#252525] px-1 [scrollbar-width:none]"
          >
            {episodes.map((episode) => {
              const score = Number(episode.vote_average || 0);
              const isSelected =
                episode.episode_number === selectedEpisodeNumber;

              // Use a percentage of the fixed 60px bar area.
              // TMDB episode scores are on a 0–10 scale.
              const barHeight = `${Math.max(8, (score / 10) * 100)}%`;

              return (
                <button
                  key={episode.id}
                  type="button"
                  onClick={() =>
                    setSelectedEpisodeNumber(episode.episode_number)
                  }
                  title={`${episode.name} — ${getRating(score)}`}
                  className="group flex h-full w-[60px] shrink-0 flex-col items-center justify-end"
                >
                  <div
                    className={`relative flex w-full items-start justify-center overflow-hidden rounded-t-lg border transition ${
                      isSelected
                        ? "border-[#61F1AC] bg-[#61F1AC]"
                        : "border-[#303030] bg-[#171717] group-hover:border-[#61F1AC]/60"
                    }`}
                    style={{
                      height: barHeight,
                      minHeight: "25px",
                      maxHeight: "100%",
                    }}
                  >
                    <span
                      className={`pt-1.5 text-xs font-semibold tabular-nums ${
                        isSelected ? "text-[#07130D]" : "text-[#C5C5C5]"
                      }`}
                    >
                      {score > 0 ? getRating(score) : "—"}
                    </span>
                  </div>

                  <span
                    className={`h-7 pt-2 text-xs ${
                      isSelected
                        ? "font-semibold text-white"
                        : "text-[#858585]"
                    }`}
                  >
                    E{episode.episode_number}
                  </span>
                </button>
              );
            })}
          </div>

          {episodes.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => scrollRatingStrip(-1)}
                aria-label="Previous episodes"
                className="absolute left-0 top-1/3 z-10 rounded-full border border-[#252525] bg-[#101010]/95 p-2 text-[#B5B5B5] hover:text-white"
              >
                <ArrowLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => scrollRatingStrip(1)}
                aria-label="Next episodes"
                className="absolute right-0 top-1/3 z-10 rounded-full border border-[#252525] bg-[#101010]/95 p-2 text-[#B5B5B5] hover:text-white"
              >
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======================================================
          FEATURED EPISODE
      ====================================================== */}

      {loadingEpisodes ? (
        <div className="h-[300px] animate-pulse rounded-xl border border-[#1C1C1C] bg-[#0B0B0B]" />
      ) : selectedEpisode ? (
        <div className="relative grid min-w-0 overflow-hidden rounded-xl border border-[#1C1C1C] bg-[#080A0D] md:grid-cols-[1.2fr_1fr]">

          {/* Large episode still */}
          <div className="group relative aspect-video min-w-0 overflow-hidden bg-[#111] md:aspect-auto md:min-h-[290px]">
            {selectedEpisode.still_path ? (
              <img
                src={getImage(selectedEpisode.still_path, "w1280")}
                alt={selectedEpisode.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-[#777]">
                Episode preview unavailable
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

            <button
              type="button"
              onClick={() => {
                // TMDB provides images and metadata, not a playable video.
                // Connect your own authorized video source here if available.
                if (selectedEpisode.still_path) {
                  window.open(
                    `https://www.themoviedb.org/tv/${seriesId}/season/${selectedSeason}/episode/${selectedEpisode.episode_number}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }
              }}
              className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-black/85"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50">
                <Play size={12} fill="currentColor" />
              </span>
              View Episode
            </button>
          </div>

          {/* Episode information */}
          <div className="relative flex min-w-0 flex-col justify-center p-5 sm:p-7">
            <button
              type="button"
              onClick={() => {
                const index = episodes.findIndex(
                  (episode) =>
                    episode.episode_number === selectedEpisodeNumber
                );

                if (index >= 0 && index < episodes.length - 1) {
                  setSelectedEpisodeNumber(
                    episodes[index + 1].episode_number
                  );
                }
              }}
              aria-label="Next episode"
              className="absolute right-4 top-4 rounded-full bg-[#14171B] p-2.5 text-white transition hover:bg-[#252A30]"
            >
              <ChevronRight size={22} />
            </button>

            <div className="mb-3 flex flex-wrap items-center gap-2 pr-10 text-xs text-[#8B949E]">
              <span className="rounded-full bg-emerald-950/70 px-2.5 py-1 font-semibold text-[#61F1AC]">
                S{selectedSeason}.E{selectedEpisode.episode_number}
              </span>

              <span>
                {formatDate(selectedEpisode.air_date)}
              </span>
            </div>

            <h3 className="pr-7 text-xl font-semibold leading-snug sm:text-2xl">
              {selectedEpisode.name}
            </h3>

            <div className="mt-3 flex items-center gap-2">
              <Star
                size={20}
                fill="currentColor"
                className="text-[#61F1AC]"
              />

              <span className="text-xl font-bold text-[#61F1AC]">
                {getRating(selectedEpisode.vote_average)}
              </span>

              <span className="text-sm text-[#7A7A7A]">
                ({(selectedEpisode.vote_count || 0).toLocaleString()})
              </span>
            </div>

            <p className="mt-4 line-clamp-4 text-sm leading-6 text-[#A3ADB9]">
              {selectedEpisode.overview ||
                "No episode description is available yet."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[#202329] pt-4 text-xs text-[#929BA7]">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} />
                {selectedEpisode.runtime
                  ? `${selectedEpisode.runtime}m`
                  : "Runtime N/A"}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Tag size={14} />
                {series.genres?.map((genre) => genre.name).join(", ") ||
                  "Genres N/A"}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Monitor size={14} />
                {series.original_language?.toUpperCase() || "TV"}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleSaved(selectedEpisode.episode_number)}
                className="inline-flex items-center gap-2 rounded-full border border-[#292D33] bg-[#13161A] px-4 py-2.5 text-xs font-medium transition hover:border-[#61F1AC]/50"
              >
                {savedEpisodes.includes(selectedEpisode.episode_number) ? (
                  <Check size={14} className="text-[#61F1AC]" />
                ) : (
                  <Plus size={14} />
                )}
                {savedEpisodes.includes(selectedEpisode.episode_number)
                  ? "In My List"
                  : "My List"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRatingEpisode(selectedEpisode.episode_number);
                  setShowRatingPicker((current) => !current);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#292D33] bg-[#13161A] px-4 py-2.5 text-xs font-medium transition hover:border-[#61F1AC]/50"
              >
                <Star size={14} />
                Rate
              </button>
            </div>

            {/* User rating: separate from the TMDB community rating */}
            {showRatingPicker && (
              <div className="mt-4 rounded-xl border border-[#292D33] bg-[#101317] p-3">
                <p className="mb-2 text-xs text-[#929BA7]">
                  Your rating
                </p>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const currentRating =
                      userRatings[
                        `${selectedSeason}-${ratingEpisode}`
                      ] || 0;

                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() =>
                          rateEpisode(ratingEpisode, rating)
                        }
                        aria-label={`Rate ${rating} out of 5`}
                        className="p-1 text-[#656B73] transition hover:scale-110 hover:text-[#61F1AC]"
                      >
                        <Star
                          size={21}
                          fill={
                            currentRating >= rating
                              ? "currentColor"
                              : "transparent"
                          }
                          className={
                            currentRating >= rating
                              ? "text-[#61F1AC]"
                              : ""
                          }
                        />
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowRatingPicker(false)}
                    className="ml-auto text-xs text-[#929BA7] hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1C1C1C] p-6 text-sm text-[#8A8A8A]">
          No episodes are available for this season.
        </div>
      )}

      {/* ======================================================
          ALL EPISODES
      ====================================================== */}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">All Episodes</h3>
            <p className="mt-1 text-xs text-[#737373]">
              {episodes.length} episodes in Season {selectedSeason}
            </p>
          </div>

          {/* Working sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setSortDropdownOpen((current) => !current)
              }
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/40 hover:text-[#F5F5F5] transition-colors cursor-pointer"
            >
              Sort by:{" "}
              <span className="text-white">
                {{
                  episode: "Episode Order",
                  rating: "Highest Rated",
                  "rating-low": "Lowest Rated",
                  title: "Title",
                  newest: "Newest First",
                }[sortBy]}
              </span>
              <ChevronDown size={13} />
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-lg border border-[#252525] bg-[#0B0B0B] py-1 shadow-xl">
                {[
                  ["episode", "Episode Order"],
                  ["rating", "Highest Rated"],
                  ["rating-low", "Lowest Rated"],
                  ["title", "Title"],
                  ["newest", "Newest First"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSortBy(value);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs transition hover:bg-[#171717] ${
                      sortBy === value
                        ? "text-[#61F1AC]"
                        : "text-[#B5B5B5]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="divide-y divide-[#1C1C1C] border-t border-[#1C1C1C]">
          {sortedEpisodes.map((episode) => {
            const isSelected =
              episode.episode_number === selectedEpisodeNumber;

            return (
              <button
                key={episode.id}
                type="button"
                onClick={() =>
                  setSelectedEpisodeNumber(episode.episode_number)
                }
                className={`group flex w-full min-w-0 items-center gap-3 border-l-[3px] px-3 py-3 text-left transition sm:gap-4 sm:px-4 ${
                  isSelected
                    ? "border-l-[#61F1AC] bg-[#0B0B0B]"
                    : "border-l-transparent hover:bg-[#0B0B0B]"
                }`}
              >
                {/* Episode number */}
                <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-[#7A7A7A]">
                  {formatEpisodeNumber(episode.episode_number)}
                </span>

                {/* Episode thumbnail */}
                <div className="h-[48px] w-[84px] shrink-0 overflow-hidden rounded-md border border-[#252525] bg-[#141414] sm:h-[54px] sm:w-[96px]">
                  {episode.still_path ? (
                    <img
                      src={getImage(episode.still_path, "w300")}
                      alt={episode.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-[#737373]">
                      E{episode.episode_number}
                    </div>
                  )}
                </div>

                {/* Title and description */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#F0F0F0] sm:text-sm">
                    {episode.name}
                  </p>

                  <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[#777F89] sm:text-xs">
                    {episode.overview || "No description available."}
                  </p>
                </div>

                {/* Runtime */}
                <span className="hidden shrink-0 text-xs tabular-nums text-[#7A7A7A] md:block">
                  {episode.runtime ? `${episode.runtime}m` : "—"}
                </span>

                {/* TMDB rating */}
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-950/40 px-2 py-1 text-xs font-semibold tabular-nums text-[#61F1AC]">
                  <Star size={11} fill="currentColor" />
                  {getRating(episode.vote_average)}
                </span>

                <ChevronRight
                  size={17}
                  className="shrink-0 text-[#7A7A7A] transition group-hover:translate-x-0.5 group-hover:text-white"
                />
              </button>
            );
          })}
        </div>

        {!loadingEpisodes && episodes.length === 0 && !error && (
          <p className="py-8 text-center text-sm text-[#777]">
            No episodes found.
          </p>
        )}
      </div>
    </section>
  );
}
