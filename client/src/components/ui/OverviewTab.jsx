import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Clock3,
  CalendarDays,
  Globe2,
  Tag,
  Tv,
  Star,
  Play,
  ExternalLink,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  ThumbsUp,
  ArrowLeft,
  Monitor,
  Check,
  ArrowRight,
} from "lucide-react";
import {
  getMovieDetails,
  getMovieMedia,
  getSeasonEpisodes,
} from "../../services/tmdb";
import { fetchMediaDetails } from "../../services/mediaApi";
import api from "../../services/api";
import { CastCarousel } from "../ui/CastCarousel";
import EpisodesSection from "./EpisodeSSection";

const TMDB_IMAGE = "https://image.tmdb.org/t/p/w780";
const FALLBACK_AVATAR = "/placeholder-avatar.png";

function formatVotes(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000)
    return `${(number / 1_000).toFixed(number >= 10_000 ? 0 : 1)}K`;
  return String(number);
}

function formatRuntime(runtime) {
  if (Array.isArray(runtime)) runtime = runtime[0];
  const minutes = Number(runtime);
  if (!minutes) return runtime || "Not available";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function MetaItem({ icon: Icon, label, value }) {
  if (!value || value === "Not available") return null;
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-[#61F1AC]" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#707780]">
          {label}
        </p>
        <p className="mt-1 break-words text-xs text-[#D3D7DC]">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold tracking-tight text-[#F5F5F5] sm:text-lg">
        {title}
      </h2>
      {action}
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-[#1C242B] bg-[#080D11] ${className}`}
    >
      {children}
    </section>
  );
}

function ReviewCard({ review }) {
  const author =
    review.author ||
    review.username ||
    review.user?.username ||
    "Streamly Member";
  const avatar =
    review.avatar ||
    review.author_details?.avatar_path ||
    review.user?.avatar_url;
  const avatarUrl = avatar?.startsWith("/")
    ? `https://image.tmdb.org/t/p/w185${avatar}`
    : avatar;
  const rating = Number(review.rating ?? review.author_details?.rating);
  const content =
    review.content ||
    review.comment ||
    review.text ||
    "No written review was provided.";
  const dateValue = review.created_at || review.createdAt || review.date;
  const date = dateValue
    ? new Date(dateValue).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Community review";

  return (
    <article className="min-w-0 rounded-lg border border-[#1C242B] bg-[#0B1116] p-4 transition-colors hover:border-[#61F1AC]/30">
      <div className="flex items-center gap-2.5">
        <img
          src={avatarUrl || FALLBACK_AVATAR}
          alt=""
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_AVATAR;
          }}
          className="h-8 w-8 rounded-full border border-white/10 bg-[#141A20] object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[#E9EDF0]">
            {author}
          </p>
          <p className="mt-0.5 text-[10px] text-[#737D86]">{date}</p>
        </div>
        {Number.isFinite(rating) && rating > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#61F1AC]/10 px-2 py-1 text-xs font-semibold text-[#61F1AC]">
            <Star size={11} fill="currentColor" /> {rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-3 line-clamp-4 text-xs leading-5 text-[#AAB3BC]">
        {content}
      </p>
    </article>
  );
}

/**
 * Reusable Overview tab for Movie Detail and Series Detail pages.
 * Pass movieData when the parent already fetched it; otherwise this component fetches it.
 */
export default function OverviewTab({
  id,
  category = null,
  mediaType = "MOVIE",
  movieData: initialMovieData = null,
  communityData: initialCommunityData = null,
  onCommunityDataChange,
  seriesData = null,
  onOpenReviews,
}) {
  const [movieData, setMovieData] = useState(initialMovieData);
  const [isLoading, setIsLoading] = useState(!initialMovieData);
  const [mediaData, setMediaData] = useState({
    images: { backdrops: [], posters: [] },
    videos: { results: [] },
  });
  const [communityData, setCommunityData] = useState(
    initialCommunityData || {
      communityAverage: null,
      communityVotes: 0,
      reviews: [],
    },
  );
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [episodeMessage, setEpisodeMessage] = useState("");
  const [episodeStartIndex, setEpisodeStartIndex] = useState(0);
  const visibleEpisodeCount = 8;

  const visibleEpisodes = seasonEpisodes.slice(
    episodeStartIndex,
    episodeStartIndex + visibleEpisodeCount,
  );

  const details = movieData || {};

  const seasons = useMemo(
    () =>
      (details.seasons || seriesData?.seasons || []).filter(
        (season) => Number(season.season_number) > 0,
      ),
    [details.seasons, seriesData?.seasons],
  );

  useEffect(() => {
    if (seasons.length === 0) return;

    const seasonExists = seasons.some(
      (season) => Number(season.season_number) === Number(selectedSeason),
    );

    if (!seasonExists) {
      setSelectedSeason(Number(seasons[0].season_number));
      setSelectedEpisodeNumber(1);
      setEpisodeStartIndex(0);
      setShowRatingPicker(false);
    }
  }, [seasons, selectedSeason]);

  const isSeries =
    String(mediaType).toUpperCase() === "TV" ||
    String(mediaType).toUpperCase() === "SERIES" ||
    details.type === "TV Series" ||
    details.media_type === "tv";

  const [savedEpisodes, setSavedEpisodes] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [ratingEpisode, setRatingEpisode] = useState(null);
  const [showRatingPicker, setShowRatingPicker] = useState(false);

  const ratingStripRef = useRef(null);

  function toggleSaved(episodeNumber) {
    setSavedEpisodes((current) =>
      current.includes(episodeNumber)
        ? current.filter((number) => number !== episodeNumber)
        : [...current, episodeNumber],
    );
  }

  function rateEpisode(episodeNumber, rating) {
    setUserRatings((current) => ({
      ...current,
      [`${selectedSeason}-${episodeNumber}`]: rating,
    }));

    setShowRatingPicker(false);
  }

  function scrollRatingStrip(direction) {
    ratingStripRef.current?.scrollBy({
      left: direction * 300,
      behavior: "smooth",
    });
  }

  function changeSeason(seasonNumber) {
    setSelectedSeason(Number(seasonNumber));
    setSelectedEpisodeNumber(1);
    setShowRatingPicker(false);
    setEpisodeStartIndex(0);

    if (ratingStripRef.current) {
      ratingStripRef.current.scrollLeft = 0;
    }
  }

  useEffect(() => setMovieData(initialMovieData), [initialMovieData]);
  useEffect(() => {
    if (initialCommunityData) setCommunityData(initialCommunityData);
  }, [initialCommunityData]);

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      if (initialMovieData) {
        setIsLoading(false);
        return;
      }
      if (!id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = category
          ? await fetchMediaDetails(category, id)
          : await getMovieDetails(id);
        if (active && data) setMovieData(data);
      } catch (error) {
        console.error("Failed to load overview details:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadOverview();
    return () => {
      active = false;
    };
  }, [id, category, initialMovieData]);

  useEffect(() => {
    let active = true;
    async function loadMedia() {
      if (category || !id) return;
      try {
        const data = await getMovieMedia(id);
        if (active && data) setMediaData(data);
      } catch (error) {
        console.error("Failed to load overview media:", error);
      }
    }
    loadMedia();
    return () => {
      active = false;
    };
  }, [id, category]);

  // Fetch the selected TV season from TMDB. This is intentionally limited to
  // the episode selector and featured episode; there is no All Episodes list.
  useEffect(() => {
  if (!isSeries || !id) {
    setSeasonEpisodes([]);
    setSeasonLoading(false);
    return;
  }

  let active = true;

  async function loadSeasonEpisodes() {
    setSeasonLoading(true);
    setEpisodeMessage("");
    setSeasonEpisodes([]);
    setEpisodeStartIndex(0);

    try {
      console.log("[OverviewTab] Loading season:", {
        id,
        selectedSeason,
      });

      const response = await getSeasonEpisodes(
        id,
        Number(selectedSeason)
      );

      console.log("[OverviewTab] Raw episode response:", response);

      if (!active) return;

      // Handle common API response formats.
      const episodes = Array.isArray(response)
        ? response
        : Array.isArray(response?.episodes)
          ? response.episodes
          : Array.isArray(response?.data?.episodes)
            ? response.data.episodes
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.results)
                ? response.results
                : [];

      if (!episodes.length) {
        console.warn(
          "[OverviewTab] No episodes found. Inspect the raw response above."
        );

        setSeasonEpisodes([]);
        setEpisodeMessage(
          "No episodes returned by the API for this season."
        );
        return;
      }

      const normalizedEpisodes = episodes
        .map((episode, index) => ({
          ...episode,
          id: episode.id ?? `${selectedSeason}-${index}`,
          episode_number: Number(
            episode.episode_number ??
              episode.episodeNumber ??
              episode.number ??
              0
          ),
          name: episode.name || episode.title || "Untitled episode",
          overview:
            episode.overview || episode.description || "",
          runtime: Number(episode.runtime) || null,
          vote_average:
            Number(
              episode.vote_average ??
                episode.voteAverage ??
                episode.score
            ) || 0,
          vote_count: Number(episode.vote_count) || 0,
          still_path:
            episode.still_path ||
            episode.thumbnail ||
            episode.still ||
            null,
          air_date: episode.air_date || episode.airDate || "",
        }))
        .filter((episode) => episode.episode_number > 0)
        .sort((a, b) => a.episode_number - b.episode_number);

      if (!active) return;

      setSeasonEpisodes(normalizedEpisodes);
      setSelectedEpisodeNumber(
        normalizedEpisodes[0]?.episode_number ?? 1
      );

      if (!normalizedEpisodes.length) {
        setEpisodeMessage(
          "The API returned data, but no valid episode numbers were found."
        );
      }
    } catch (error) {
      console.error(
        "[OverviewTab] Episode request failed:",
        error
      );

      if (active) {
        setSeasonEpisodes([]);
        setEpisodeMessage(
          error.message || "Failed to load season episodes."
        );
      }
    } finally {
      if (active) {
        setSeasonLoading(false);
      }
    }
  }

  loadSeasonEpisodes();

  return () => {
    active = false;
  };
}, [id, isSeries, selectedSeason]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    async function loadReviews() {
      const provider = category
        ? ["manga", "manhwa", "manhua"].includes(category)
          ? "mangadex"
          : "openlibrary"
        : "tmdb";
      try {
        const response = await api.get(`/reviews/${provider}/${id}`);
        if (!active || !response?.success) return;
        const data = response.data || {};
        const nextData = {
          communityAverage:
            typeof data.communityAverage === "number"
              ? data.communityAverage
              : null,
          communityVotes: Number(data.communityVotes) || 0,
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
        };
        setCommunityData(nextData);
        onCommunityDataChange?.(nextData);
      } catch (error) {
        // TMDB provider reviews below are used as a fallback when the community endpoint is unavailable.
        console.warn("Could not load community reviews for overview:", error);
      }
    }
    loadReviews();
    return () => {
      active = false;
    };
  }, [id, category, onCommunityDataChange]);

  const title =
    details.title ||
    details.name ||
    (isSeries ? "Series overview" : "Movie overview");
  const overview =
    details.synopsis ||
    details.overview ||
    details.description ||
    "No overview is available for this title yet.";
  const genres = Array.isArray(details.genres)
    ? details.genres
        .map((genre) => (typeof genre === "string" ? genre : genre.name))
        .filter(Boolean)
        .join(", ")
    : details.genres || "Not available";
  const cast = Array.isArray(details.cast)
    ? details.cast.map((member) => ({
        ...member,
        name: member.name || member.original_name || "Cast member",
        character:
          member.character ||
          member.roles?.[0]?.character ||
          member.known_for_department ||
          "Cast member",
        avatar:
          member.avatar ||
          member.profile ||
          (member.profile_path
            ? `https://image.tmdb.org/t/p/w342${member.profile_path}`
            : ""),
      }))
    : [];
  const tmdbReviews = Array.isArray(details.reviews) ? details.reviews : [];
  const reviews = communityData.reviews?.length
    ? communityData.reviews
    : tmdbReviews;
  const score =
    communityData.communityAverage ??
    (Number(details.tmdbRating ?? details.vote_average ?? details.rating) || 0);
  const voteCount =
    communityData.communityVotes ||
    Number(details.tmdbVotes ?? details.vote_count) ||
    0;
  const backdrop =
    details.backdrop ||
    details.backdrop_path ||
    details.poster ||
    details.poster_path;
  const backdropUrl = backdrop?.startsWith("http")
    ? backdrop
    : backdrop
      ? `${TMDB_IMAGE}${backdrop}`
      : "";
  const videos = mediaData.videos?.results || details.videos?.results || [];
  const trailer =
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.type === "Teaser"),
    ) || videos.find((video) => video.site === "YouTube");
  const releaseDate =
    details.release_date || details.first_air_date || details.year;
  const year = releaseDate ? String(releaseDate).slice(0, 4) : "Not available";
  const runtime = formatRuntime(
    details.runtime || details.episode_run_time || details.duration,
  );
  const status = details.status || details.details?.status || "Not available";
  const language =
    details.original_language_name ||
    details.originalLanguage ||
    details.original_language ||
    "Not available";
  const studio =
    details.studio ||
    details.networks?.map((item) => item.name).join(", ") ||
    details.production_companies
      ?.map((item) => item.name)
      .slice(0, 2)
      .join(", ") ||
    "Not available";
  const source =
    details.source ||
    details.details?.source ||
    (isSeries ? "TV Series" : "Feature Film");
  const quickFacts = [
    { label: "Status", value: status, icon: Info },
    {
      label: isSeries ? "Total Seasons" : "Release Year",
      value: isSeries
        ? details.number_of_seasons ||
          details.seasons?.length ||
          "Not available"
        : year,
      icon: CalendarDays,
    },
    {
      label: isSeries ? "Episodes" : "Runtime",
      value: isSeries ? details.number_of_episodes || "Not available" : runtime,
      icon: Clock3,
    },
    { label: "Original Language", value: language, icon: Globe2 },
    { label: "Genres", value: genres, icon: Tag },
    { label: isSeries ? "Network" : "Studio", value: studio, icon: Tv },
  ];
  const ratingBuckets = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1];
    const counts = buckets.map(
      (star) =>
        reviews.filter(
          (review) =>
            Math.round(
              Number(review.rating ?? review.author_details?.rating) || 0,
            ) === star,
        ).length,
    );
    const total = counts.reduce((sum, value) => sum + value, 0);
    return buckets.map((star, index) => ({
      star,
      count: counts[index],
      percent: total ? Math.round((counts[index] / total) * 100) : 0,
    }));
  }, [reviews]);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-56 rounded-xl bg-[#0B1116]" />
        <div className="h-36 rounded-xl bg-[#0B1116]" />
        <div className="h-48 rounded-xl bg-[#0B1116]" />
      </div>
    );
  }

  return (
    <div className="space-y-9 text-[#F5F5F5]">
      {/* About + Quick Info */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(270px,0.9fr)]">
        <Panel className="overflow-hidden">
          <div className="grid h-full grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() =>
                trailer?.key &&
                window.open(
                  `https://www.youtube.com/watch?v=${trailer.key}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="group relative min-h-[220px] overflow-hidden bg-[#05080A] text-left md:min-h-[270px]"
              aria-label={
                trailer ? "Watch trailer" : "Trailer preview unavailable"
              }
            >
              {backdropUrl ? (
                <img
                  src={backdropUrl}
                  alt={`${title} preview`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white shadow-xl backdrop-blur transition-all group-hover:scale-110 group-hover:border-[#61F1AC] group-hover:text-[#61F1AC]">
                  <Play size={19} fill="currentColor" />
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-white">
                  {trailer ? `Watch ${trailer.type || "Preview"}` : "Preview"}
                </span>
                <span className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[10px] text-white/80">
                  {trailer ? "YouTube" : "No trailer available"}
                </span>
              </div>
            </button>
            <div className="p-5 sm:p-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#61F1AC]">
                About this {isSeries ? "series" : "movie"}
              </p>
              <h2 className="mb-3 text-base font-semibold text-[#F5F5F5]">
                {title}
              </h2>
              <p
                className={`text-sm leading-6 text-[#A7B0B8] ${synopsisExpanded ? "" : "line-clamp-5"}`}
              >
                {overview}
              </p>
              {overview.length > 220 && (
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded((value) => !value)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#61F1AC] hover:text-white"
                >
                  {synopsisExpanded ? "Show less" : "Read more"}
                </button>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#1C242B] pt-4 text-[11px] text-[#9AA4AD]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={13} className="text-[#61F1AC]" />
                  {runtime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Tag size={13} className="text-[#61F1AC]" />
                  {genres}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-[#61F1AC]" />
                  {year}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <SectionHeading title="Quick Info" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {quickFacts.map((fact) => (
              <MetaItem
                key={fact.label}
                icon={fact.icon}
                label={fact.label}
                value={String(fact.value)}
              />
            ))}
          </div>
        </Panel>
      </div>

      {/* Cast carousel - reuses the user's existing component */}
      <section>
        <SectionHeading
          title={isSeries ? "Cast & Characters" : "Cast"}
          action={
            cast.length > 0 ? (
              <span className="text-[11px] text-[#7C8790]">
                {cast.length} people
              </span>
            ) : null
          }
        />
        <CastCarousel
          title={isSeries ? "Cast & Characters" : "Cast"}
          items={cast}
          variant="cast"
          isLoading={false}
        />
      </section>

      {/* Episodes: compact season tabs, rating selector and featured episode */}
      {isSeries && (
        <section className="min-w-0 space-y-5">
          <SectionHeading title="Episodes" />

          {/* 1. Season tabs */}
          <div className="flex gap-6 overflow-x-auto border-b border-[#1C242B] [scrollbar-width:none]">
            <div className="flex gap-6 overflow-x-auto border-b border-[#1C242B] [scrollbar-width:none]">
              {seasons.map((season) => {
                const seasonNumber = Number(season.season_number);
                const isSelected = Number(selectedSeason) === seasonNumber;

                return (
                  <button
                    key={season.id || seasonNumber}
                    type="button"
                    onClick={() => changeSeason(seasonNumber)}
                    aria-pressed={isSelected}
                    className={`relative shrink-0 border-b-2 px-1 pb-4 text-sm transition-colors ${
                      isSelected
                        ? "border-[#61F1AC] font-semibold text-[#61F1AC]"
                        : "border-transparent text-[#7C858D] hover:text-white"
                    }`}
                  >
                    {season.name || `Season ${seasonNumber}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Episode rating selector */}
          {(() => {
            const ratedEpisodes = seasonEpisodes.filter(
              (episode) => Number(episode.vote_average) > 0,
            );

            const seasonAverage = ratedEpisodes.length
              ? ratedEpisodes.reduce(
                  (total, episode) => total + Number(episode.vote_average),
                  0,
                ) / ratedEpisodes.length
              : null;

            const totalVotes = seasonEpisodes.reduce(
              (total, episode) => total + (Number(episode.vote_count) || 0),
              0,
            );

            return (
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8B959E]">
                  <span>S{selectedSeason} Episodes</span>
                  <span className="text-[#454D55]">·</span>

                  <span className="inline-flex items-center gap-1 text-[#61F1AC]">
                    <Star size={12} fill="currentColor" />
                    {seasonAverage === null
                      ? "No ratings yet"
                      : `${seasonAverage.toFixed(1)} Average`}
                  </span>

                  <span className="text-[#454D55]">·</span>

                  <span>{totalVotes.toLocaleString()} episode votes</span>
                </div>

                {seasonLoading ? (
                  <div className="flex h-[82px] items-end gap-2 overflow-hidden border-b border-[#1C242B] pb-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-12 min-w-[48px] flex-1 animate-pulse rounded-t-md bg-[#141C22]"
                      />
                    ))}
                  </div>
                ) : seasonEpisodes.length > 0 ? (
                  <div className="relative min-w-0">
                    <div
                      ref={ratingStripRef}
                      className="flex h-[82px] items-end gap-2 overflow-x-auto border-b border-[#1C242B] px-1 [scrollbar-width:none]"
                    >
                      {seasonEpisodes.map((episode) => {
                        const score = Number(episode.vote_average) || 0;
                        const isSelected =
                          Number(episode.episode_number) ===
                          Number(selectedEpisodeNumber);

                        const barHeight = `${Math.max(8, (score / 10) * 100)}%`;

                        return (
                          <button
                            key={episode.id || episode.episode_number}
                            type="button"
                            onClick={() => {
                              setSelectedEpisodeNumber(
                                Number(episode.episode_number),
                              );
                              setShowRatingPicker(false);
                            }}
                            title={`${episode.name} — ${
                              score ? score.toFixed(1) : "Not rated"
                            }`}
                            className="group flex h-full w-[48px] shrink-0 flex-col items-center justify-end"
                          >
                            <div
                              className={`flex w-full items-start justify-center overflow-hidden rounded-t-md border transition ${
                                isSelected
                                  ? "border-[#61F1AC] bg-[#61F1AC]"
                                  : "border-[#26323B] bg-[#101820] group-hover:border-[#61F1AC]/60"
                              }`}
                              style={{
                                height: barHeight,
                                minHeight: "23px",
                                maxHeight: "100%",
                              }}
                            >
                              <span
                                className={`pt-1 text-[10px] font-semibold tabular-nums ${
                                  isSelected
                                    ? "text-[#07130D]"
                                    : "text-[#C5CDD4]"
                                }`}
                              >
                                {score > 0 ? score.toFixed(1) : "—"}
                              </span>
                            </div>

                            <span
                              className={`h-6 pt-1.5 text-[10px] ${
                                isSelected
                                  ? "font-semibold text-[#61F1AC]"
                                  : "text-[#89939C]"
                              }`}
                            >
                              E{episode.episode_number}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Fixed selector container with navigation arrows */}
                    {seasonEpisodes.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => scrollRatingStrip(-1)}
                          aria-label="Previous episodes"
                          className="absolute left-0 top-1/3 z-10 rounded-full border border-[#26323B] bg-[#080D11]/95 p-1.5 text-[#B5BEC6] hover:text-[#61F1AC]"
                        >
                          <ArrowLeft size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => scrollRatingStrip(1)}
                          aria-label="Next episodes"
                          className="absolute right-0 top-1/3 z-10 rounded-full border border-[#26323B] bg-[#080D11]/95 p-1.5 text-[#B5BEC6] hover:text-[#61F1AC]"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="py-4 text-xs text-[#7D8790]">
                    {episodeMessage ||
                      "No episodes are available for this season."}
                  </p>
                )}
              </div>
            );
          })()}

          {/* 3. Featured episode */}
          {seasonLoading ? (
            <div className="h-[220px] animate-pulse rounded-xl border border-[#1C242B] bg-[#0B1116]" />
          ) : (
            (() => {
              const episode = seasonEpisodes.find(
                (item) =>
                  Number(item.episode_number) === Number(selectedEpisodeNumber),
              );

              if (!episode) {
                return (
                  <Panel className="p-5 text-sm text-[#89939C]">
                    {episodeMessage ||
                      "No episodes are available for this season."}
                  </Panel>
                );
              }

              const episodeStill = episode.still_path
                ? episode.still_path.startsWith("http")
                  ? episode.still_path
                  : `https://image.tmdb.org/t/p/w780${episode.still_path}`
                : backdropUrl;

              const episodeRating = Number(episode.vote_average) || 0;
              const episodeKey = `${selectedSeason}-${episode.episode_number}`;
              const saved = savedEpisodes.includes(
                Number(episode.episode_number),
              );

              return (
                <Panel className="overflow-hidden">
                  <div className="grid min-w-0 grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                    {/* Episode thumbnail */}
                    <div className="group relative aspect-video min-w-0 overflow-hidden bg-[#05080A] md:aspect-auto md:min-h-[220px]">
                      {episodeStill ? (
                        <img
                          src={episodeStill}
                          alt={episode.name || "Episode preview"}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full min-h-[180px] items-center justify-center text-xs text-[#7D8790]">
                          Episode preview unavailable
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <a
                        href={`https://www.themoviedb.org/tv/${id}/season/${selectedSeason}/episode/${episode.episode_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-[10px] font-medium text-white backdrop-blur hover:bg-black/85"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/50">
                          <Play size={11} fill="currentColor" />
                        </span>
                        View Episode
                      </a>
                    </div>

                    {/* Episode details */}
                    <div className="relative flex min-w-0 flex-col justify-center p-4 sm:p-5">
                      <button
                        type="button"
                        onClick={() => {
                          const index = seasonEpisodes.findIndex(
                            (item) =>
                              Number(item.episode_number) ===
                              Number(selectedEpisodeNumber),
                          );

                          if (index >= 0 && index < seasonEpisodes.length - 1) {
                            setSelectedEpisodeNumber(
                              Number(seasonEpisodes[index + 1].episode_number),
                            );
                            setShowRatingPicker(false);
                          }
                        }}
                        aria-label="Next episode"
                        disabled={
                          Number(selectedEpisodeNumber) >=
                          Math.max(
                            ...seasonEpisodes.map(
                              (item) => Number(item.episode_number) || 0,
                            ),
                          )
                        }
                        className="absolute right-3 top-3 rounded-full bg-[#141C22] p-2 text-white transition hover:bg-[#202B33] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronRight size={18} />
                      </button>

                      <div className="mb-2 flex flex-wrap items-center gap-2 pr-8 text-[10px] text-[#89939C]">
                        <span className="rounded-full bg-[#61F1AC]/10 px-2 py-1 font-semibold text-[#61F1AC]">
                          S{selectedSeason}.E{episode.episode_number}
                        </span>

                        <span>
                          {episode.air_date
                            ? new Date(
                                `${episode.air_date}T00:00:00`,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Air date unavailable"}
                        </span>
                      </div>

                      <h3 className="pr-6 text-base font-semibold leading-snug text-[#F5F5F5] sm:text-lg">
                        {episode.name || `Episode ${episode.episode_number}`}
                      </h3>

                      <div className="mt-2 flex items-center gap-2">
                        <Star
                          size={17}
                          fill="currentColor"
                          className="text-[#61F1AC]"
                        />

                        <span className="text-lg font-bold text-[#61F1AC]">
                          {episodeRating > 0 ? episodeRating.toFixed(1) : "—"}
                        </span>

                        <span className="text-[10px] text-[#7D8790]">
                          ({formatVotes(episode.vote_count || 0)} votes)
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#A7B0B8]">
                        {episode.overview ||
                          "No episode description is available yet."}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#1C242B] pt-3 text-[10px] text-[#89939C]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={12} className="text-[#61F1AC]" />
                          {episode.runtime
                            ? `${episode.runtime} min`
                            : "Runtime N/A"}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Monitor size={12} className="text-[#61F1AC]" />
                          {(details.original_language || language || "TV")
                            .toString()
                            .toUpperCase()}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Tag size={12} className="text-[#61F1AC]" />
                          {genres}
                        </span>
                      </div>

                      {/* My List and Rate */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleSaved(Number(episode.episode_number))
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#26323B] bg-[#101820] px-3 py-2 text-[10px] font-medium transition hover:border-[#61F1AC]/50"
                        >
                          {saved ? (
                            <Check size={12} className="text-[#61F1AC]" />
                          ) : (
                            <Plus size={12} />
                          )}
                          {saved ? "In My List" : "My List"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRatingEpisode(Number(episode.episode_number));
                            setShowRatingPicker((current) => !current);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#26323B] bg-[#101820] px-3 py-2 text-[10px] font-medium transition hover:border-[#61F1AC]/50"
                        >
                          <Star size={12} />
                          Rate
                          {userRatings[episodeKey]
                            ? ` · ${userRatings[episodeKey]}/5`
                            : ""}
                        </button>
                      </div>

                      {showRatingPicker &&
                        Number(ratingEpisode) ===
                          Number(episode.episode_number) && (
                          <div className="mt-3 rounded-lg border border-[#26323B] bg-[#0B1116] p-3">
                            <p className="mb-2 text-[10px] text-[#89939C]">
                              Your rating
                            </p>

                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((rating) => {
                                const currentRating =
                                  userRatings[episodeKey] || 0;

                                return (
                                  <button
                                    key={rating}
                                    type="button"
                                    onClick={() =>
                                      rateEpisode(
                                        Number(episode.episode_number),
                                        rating,
                                      )
                                    }
                                    aria-label={`Rate ${rating} out of 5`}
                                    className="text-[#737D86] transition hover:scale-110 hover:text-[#61F1AC]"
                                  >
                                    <Star
                                      size={18}
                                      fill={
                                        currentRating >= rating
                                          ? "currentColor"
                                          : "none"
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
                                className="ml-auto text-[10px] text-[#89939C] hover:text-white"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </Panel>
              );
            })()
          )}
        </section>
      )}


      {/* Reviews */}
      <section>
        <SectionHeading
          title="Reviews"
          action={
            onOpenReviews ? (
              <button
                type="button"
                onClick={onOpenReviews}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#61F1AC] hover:text-white"
              >
                View all <ExternalLink size={12} />
              </button>
            ) : null
          }
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <Panel className="p-5">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-semibold tracking-tight text-[#61F1AC]">
                {score ? Number(score).toFixed(1) : "—"}
              </span>
              <span className="pb-1 text-sm text-[#7B858E]">/10</span>
            </div>
            <p className="mt-1 text-xs text-[#8B959E]">
              {formatVotes(voteCount)} ratings
            </p>
            <div className="mt-4 flex items-center gap-1 text-[#61F1AC]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={15}
                  fill={star <= Math.round(score / 2) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <div className="mt-5 space-y-2.5">
              {ratingBuckets.map((bucket) => (
                <div
                  key={bucket.star}
                  className="flex items-center gap-2 text-[10px] text-[#8B959E]"
                >
                  <span className="w-5 shrink-0">{bucket.star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1A232A]">
                    <div
                      className="h-full rounded-full bg-[#61F1AC]"
                      style={{ width: `${bucket.percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums">
                    {bucket.percent}%
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          {reviews.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reviews.slice(0, 3).map((review, index) => (
                <ReviewCard
                  key={review.id || review._id || index}
                  review={review}
                />
              ))}
            </div>
          ) : (
            <Panel className="flex min-h-[180px] flex-col items-center justify-center p-6 text-center">
              <Star size={22} className="text-[#61F1AC]" />
              <p className="mt-3 text-sm font-medium text-[#DCE1E5]">
                No reviews yet
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[#7D8790]">
                Community reviews will appear here when they are available.
              </p>
              {onOpenReviews && (
                <button
                  type="button"
                  onClick={onOpenReviews}
                  className="mt-4 rounded-lg border border-[#61F1AC]/40 px-3 py-2 text-xs font-semibold text-[#61F1AC] hover:bg-[#61F1AC]/10"
                >
                  Write a review
                </button>
              )}
            </Panel>
          )}
        </div>
      </section>

      {/* Details */}
      <section>
        <SectionHeading title="Details" />
        <Panel className="grid grid-cols-2 gap-x-5 gap-y-0 p-4 sm:grid-cols-3 lg:grid-cols-6 lg:p-5">
          <MetaItem icon={Info} label="Status" value={String(status)} />
          <MetaItem
            icon={CalendarDays}
            label={isSeries ? "First Air Year" : "Release Year"}
            value={String(year)}
          />
          <MetaItem
            icon={Clock3}
            label={isSeries ? "Episode Runtime" : "Runtime"}
            value={String(runtime)}
          />
          <MetaItem icon={Globe2} label="Language" value={String(language)} />
          <MetaItem icon={Tag} label="Genres" value={String(genres)} />
          <MetaItem
            icon={Tv}
            label={isSeries ? "Network" : "Studio"}
            value={String(studio)}
          />
          <div className="col-span-full mt-4 border-t border-[#1C242B] pt-4">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <span className="text-[#707B84]">Original title </span>
                <span className="ml-2 text-[#D3D8DC]">
                  {details.original_title || details.original_name || title}
                </span>
              </div>
              <div>
                <span className="text-[#707B84]">TMDB ID </span>
                <span className="ml-2 text-[#D3D8DC]">
                  {details.id || id || "Not available"}
                </span>
              </div>
              <div>
                <span className="text-[#707B84]">Production </span>
                <span className="ml-2 text-[#D3D8DC]">{studio}</span>
              </div>
              <div>
                <span className="text-[#707B84]">Source </span>
                <span className="ml-2 text-[#D3D8DC]">{source}</span>
              </div>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
