import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Clock3,
  CalendarDays,
  Globe2,
  Tag,
  Tv,
  Star,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  getMovieDetails,
  getMovieMedia,
  getSeasonEpisodes,
  getSeriesDetails,
} from "../../services/tmdb";
import { fetchMediaDetails } from "../../services/mediaApi";
import api from "../../services/api";
import { CastCarousel } from "./CastCarousel";
import MetaItem from "./MetaItem";

const TMDB_IMAGE = "https://image.tmdb.org/t/p/w780";
function getReviewAvatarUrl(review) {
  // TMDB avatar paths need special handling.
  const tmdbAvatar = review.author_details?.avatar_path;

  if (typeof tmdbAvatar === "string" && tmdbAvatar.trim()) {
    const path = tmdbAvatar.trim();

    // TMDB sometimes returns: /https://secure.gravatar.com/...
    if (/^\/https?:\/\//i.test(path)) {
      return path.slice(1);
    }

    // Already a complete URL.
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    // A normal TMDB image path, such as /abc123.jpg.
    if (path.startsWith("/")) {
      return `https://image.tmdb.org/t/p/w185${path}`;
    }
  }

  // Check the avatar fields supplied by your community API.
  const candidates = [
    review.avatarUrl,
    review.authorAvatar,
    review.author_avatar,
    review.user?.avatar_url,
    review.avatar,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) {
      continue;
    }

    const path = candidate.trim();

    // Preserve external image URLs.
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    // Handle protocol-relative URLs.
    if (path.startsWith("//")) {
      return `https:${path}`;
    }

    // Preserve local application paths instead of sending them to TMDB.
    if (path.startsWith("/")) {
      return path;
    }
  }

  return null;
}
// Toggle this to false to keep the review carousel manual-only during testing.
const ENABLE_REVIEW_AUTO_SCROLL = true;
const REVIEW_AUTO_SCROLL_SPEED = 24;

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

function getReviewRating(review) {
  return Number(review.rating ?? review.score ?? review.author_details?.rating);
}

function ratingToStars(rating) {
  return rating > 5 ? rating / 2 : rating;
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
    review.authorName ||
    review.author_name ||
    review.username ||
    review.user?.username ||
    "Streamly Member";
  const avatarUrl = getReviewAvatarUrl(review);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const rating = getReviewRating(review);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const content =
    review.content ||
    review.comment ||
    review.text ||
    "No written review was provided.";
  const dateValue =
    review.created_at || review.createdAt || review.time || review.date;
  const parsedDate = dateValue ? new Date(dateValue) : null;
  const date =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;
  const reviewType = review.source === "tmdb" ? "TMDB" : "Community";
  const subline = [reviewType, date].filter(Boolean).join(" · ");

  return (
    <article className="mr-3 flex h-[216px] w-[290px] shrink-0 flex-col rounded-2xl border border-[#1C242B] bg-[#080D11] p-5 transition duration-300 hover:-translate-y-0.5  sm:w-[320px]">
      <header className="flex items-center gap-3">
        {avatarUrl && !avatarFailed ? (
          <img
            src={avatarUrl}
            alt={`${author}'s avatar`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setAvatarFailed(true)}
            className="h-9 w-9 shrink-0 rounded-full bg-[#262A2F] object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#262A2F] text-sm font-medium text-[#C4CAD0]"
          >
            {String(author).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#ECEEF0]">
            {author}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[#7B838B]">
            {subline}
          </p>
        </div>
        {hasRating && (
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums text-[#ECEEF0]">
            <Star size={13} fill="currentColor" className="text-[#61F1AC]" />
            {rating.toFixed(1)}
          </span>
        )}
      </header>
      <p className="mt-4 line-clamp-5 text-[13.5px] leading-6 text-[#A3AAB1]">
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
  seriesData = null,
  communityData: initialCommunityData = null,
  onCommunityDataChange,
  onOpenReviews,
}) {
  const [movieData, setMovieData] = useState(
    initialMovieData || seriesData || null,
  );
  const [isLoading, setIsLoading] = useState(!(initialMovieData || seriesData));
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
  const [reviewsLoading, setReviewsLoading] = useState(!initialCommunityData);
  const [reviewsError, setReviewsError] = useState("");
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [episodeMessage, setEpisodeMessage] = useState("");
  const [canScrollEpisodesLeft, setCanScrollEpisodesLeft] = useState(false);
  const [canScrollEpisodesRight, setCanScrollEpisodesRight] = useState(false);
  const episodeRowRef = useRef(null);
  const reviewCarouselRef = useRef(null);
  const reviewAutoPauseTimerRef = useRef(null);
  const reviewIsHoveredRef = useRef(false);
  const reviewManualPauseRef = useRef(false);
  const updateEpisodeScrollState = () => {
    const row = episodeRowRef.current;
    if (!row) return;

    setCanScrollEpisodesLeft(row.scrollLeft > 10);
    setCanScrollEpisodesRight(
      row.scrollLeft + row.clientWidth < row.scrollWidth - 10,
    );
  };

  const scrollEpisodes = (direction) => {
    const row = episodeRowRef.current;
    if (!row) return;

    row.scrollBy({
      left:
        direction === "left" ? -row.clientWidth * 0.75 : row.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  const details = movieData || seriesData || {};
  const isSeries =
    ["TV", "SERIES"].includes(String(mediaType).toUpperCase()) ||
    details.type === "TV Series" ||
    details.media_type === "tv" ||
    Boolean(seriesData);

  const seasons = useMemo(
    () =>
      (Array.isArray(details.seasons) ? details.seasons : []).filter(
        (season) => Number(season.season_number) > 0,
      ),
    [details.seasons],
  );
  const seriesTmdbId = seriesData?.tmdbId || details.tmdbId || id;

  useEffect(() => {
    if (initialMovieData || seriesData)
      setMovieData(initialMovieData || seriesData);
  }, [initialMovieData, seriesData]);
  useEffect(() => {
    if (initialCommunityData) setCommunityData(initialCommunityData);
  }, [initialCommunityData]);

  useEffect(() => {
    updateEpisodeScrollState();
    const row = episodeRowRef.current;
    if (!row) return undefined;

    const resizeObserver = new ResizeObserver(updateEpisodeScrollState);
    resizeObserver.observe(row);
    return () => resizeObserver.disconnect();
  }, [seasonEpisodes]);

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      if (initialMovieData || seriesData) {
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
          : isSeries
            ? await getSeriesDetails(id)
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
  }, [id, category, initialMovieData, seriesData, isSeries]);

  useEffect(() => {
    let active = true;
    async function loadMedia() {
      if (category || !id || isSeries) return;
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
  }, [id, category, isSeries]);

  // Keep the selected season valid whenever series details arrive or change.
  useEffect(() => {
    if (!isSeries || seasons.length === 0) return;
    const selectedSeasonExists = seasons.some(
      (season) => Number(season.season_number) === Number(selectedSeason),
    );
    if (!selectedSeasonExists) {
      setSelectedSeason(Number(seasons[0].season_number));
      setSelectedEpisodeNumber(1);
    }
  }, [isSeries, seasons, selectedSeason]);

  // Load episodes through the project's TMDB service, so its API configuration is reused.
  useEffect(() => {
    if (!isSeries || !id || seasons.length === 0) {
      setSeasonEpisodes([]);
      return;
    }

    let active = true;
    async function loadSeasonEpisodes() {
      setSeasonLoading(true);
      setEpisodeMessage("");
      setSeasonEpisodes([]);
      try {
        const response = await getSeasonEpisodes(seriesTmdbId, selectedSeason);
        if (!active) return;
        const episodes = Array.isArray(response)
          ? response
          : Array.isArray(response?.episodes)
            ? response.episodes
            : [];
        setSeasonEpisodes(episodes);
        setSelectedEpisodeNumber((current) =>
          episodes.some(
            (episode) => Number(episode.episode_number) === Number(current),
          )
            ? current
            : Number(episodes[0]?.episode_number || 1),
        );
        if (!episodes.length) {
          setEpisodeMessage(
            "No episode information is available for this season.",
          );
        }
      } catch (error) {
        if (active) {
          setEpisodeMessage(
            "Episodes could not be loaded. Please check the TMDB API configuration.",
          );
        }
        console.warn("Could not load TMDB season episodes:", error);
      } finally {
        if (active) setSeasonLoading(false);
      }
    }

    loadSeasonEpisodes();
    return () => {
      active = false;
    };
  }, [id, isSeries, selectedSeason, seasons.length, seriesTmdbId]);

  useEffect(() => {
    // Detail pages already fetch and pass this data, so avoid a second identical request.
    if (initialCommunityData) {
      setReviewsLoading(false);
      return undefined;
    }
    if (!id) {
      setReviewsLoading(false);
      return undefined;
    }
    let active = true;
    async function loadReviews() {
      setReviewsLoading(true);
      setReviewsError("");
      const provider = category
        ? ["manga", "manhwa", "manhua"].includes(category)
          ? "mangadex"
          : "openlibrary"
        : "tmdb";
      try {
        const response = await api.get(`/reviews/${provider}/${id}`);
        if (
          !response?.success ||
          !response.data ||
          typeof response.data !== "object"
        ) {
          throw new Error(
            "The reviews service returned an unexpected response.",
          );
        }
        if (!active) return;
        const data = response.data;
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
        if (active) {
          setReviewsError("Community reviews could not be loaded right now.");
        }
        // Provider reviews below remain available as a fallback when present.
        console.warn("Could not load community reviews for overview:", error);
      } finally {
        if (active) setReviewsLoading(false);
      }
    }
    loadReviews();
    return () => {
      active = false;
    };
  }, [id, category, initialCommunityData, onCommunityDataChange]);

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
  const reviews = useMemo(() => {
    const source = communityData.reviews?.length
      ? communityData.reviews
      : tmdbReviews;
    const seen = new Set();

    return source.filter((review, index) => {
      const key =
        review.id ||
        review._id ||
        `${review.author || review.authorName || index}-${review.content || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [communityData.reviews, tmdbReviews]);
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
            Math.round(ratingToStars(getReviewRating(review)) || 0) === star,
        ).length,
    );
    const total = counts.reduce((sum, value) => sum + value, 0);
    return buckets.map((star, index) => ({
      star,
      count: counts[index],
      percent: total ? Math.round((counts[index] / total) * 100) : 0,
    }));
  }, [reviews]);

  // Duplicates below are visual-only for a seamless loop; `reviews` remains
  // the single source of truth for counts, scores, and distribution bars.
  const canLoopReviews = reviews.length >= 3;
  const carouselReviews = useMemo(() => {
    const items = canLoopReviews ? [...reviews, ...reviews] : reviews;
    return items.map((review, index) => ({
      review,
      key: `${review.id || review._id || "review"}-${index}`,
    }));
  }, [canLoopReviews, reviews]);

  const normalizeReviewCarousel = useCallback(() => {
    const row = reviewCarouselRef.current;
    if (!row || !canLoopReviews) return;

    const loopWidth = row.scrollWidth / 2;
    if (loopWidth <= row.clientWidth + 4) return;

    if (row.scrollLeft <= 1) {
      row.scrollLeft += loopWidth;
    } else if (row.scrollLeft >= row.scrollWidth - row.clientWidth - 1) {
      row.scrollLeft -= loopWidth;
    }
  }, [canLoopReviews]);

  const pauseReviewAutoScroll = () => {
    if (!ENABLE_REVIEW_AUTO_SCROLL) return;

    reviewManualPauseRef.current = true;
    window.clearTimeout(reviewAutoPauseTimerRef.current);
    reviewAutoPauseTimerRef.current = window.setTimeout(() => {
      reviewManualPauseRef.current = false;
    }, 900);
  };

  const scrollReviews = (direction) => {
    const row = reviewCarouselRef.current;
    if (!row) return;

    pauseReviewAutoScroll();
    row.scrollBy({
      left:
        direction === "left" ? -row.clientWidth * 0.8 : row.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const row = reviewCarouselRef.current;
      if (row) row.scrollLeft = canLoopReviews ? row.scrollWidth / 2 : 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [canLoopReviews, reviews.length]);

  useEffect(
    () => () => window.clearTimeout(reviewAutoPauseTimerRef.current),
    [],
  );

  useEffect(() => {
    if (!ENABLE_REVIEW_AUTO_SCROLL || !canLoopReviews) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let frame;
    let previousTime = window.performance.now();
    const animate = (time) => {
      const row = reviewCarouselRef.current;
      if (row && !reviewIsHoveredRef.current && !reviewManualPauseRef.current) {
        const loopWidth = row.scrollWidth / 2;
        if (loopWidth > row.clientWidth + 4) {
          row.scrollLeft +=
            ((time - previousTime) / 1000) * REVIEW_AUTO_SCROLL_SPEED;
          normalizeReviewCarousel();
        }
      }
      previousTime = time;
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [canLoopReviews, normalizeReviewCarousel]);

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
      <div className="w-full">
        <Panel className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
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
            <div className="flex h-[320px] min-h-0 flex-col overflow-hidden p-5 sm:p-6">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#61F1AC]">
                  About this {isSeries ? "series" : "movie"}
                </p>
                <h2 className="mb-3 text-base font-semibold text-[#F5F5F5]">
                  {title}
                </h2>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  synopsisExpanded
                    ? "max-h-[1000px] opacity-100"
                    : "max-h-[4.5rem] opacity-90 line-clamp-3"
                }`}
              >
                <p className="text-sm leading-6 text-[#A7B0B8]">{overview}</p>
              </div>
              {overview.length > 220 && (
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded((prev) => !prev)}
                  className="mt-2 text-sm font-medium text-[#61F1AC] hover:text-[#61F1AC]/80 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  {synopsisExpanded ? "Show less" : "Read more"}
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-500 ease-in-out ${
                      synopsisExpanded ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
              )}

              <div className="mt-2 flex shrink-0 flex-wrap items-center gap-2 border-t border-[#1C242B] pt-4">
                {/* Runtime */}
                <div className="group inline-flex items-center gap-2 rounded-full border border-[#61F1AC]/20 bg-[#0D1915] px-3 py-2 transition-all duration-300 hover:border-[#61F1AC]/60 hover:bg-[#11251C] hover:shadow-[0_0_14px_rgba(97,241,172,0.08)]">
                  <Clock3
                    size={15}
                    className="shrink-0 text-[#61F1AC] transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="text-xs font-medium text-[#D8E8E0]">
                    {runtime}
                  </span>
                </div>

                {/* Genres */}
                <div className="group inline-flex max-w-full items-center gap-2 rounded-full border border-[#61F1AC]/20 bg-[#0D1915] px-3 py-2 transition-all duration-300 hover:border-[#61F1AC]/60 hover:bg-[#11251C] hover:shadow-[0_0_14px_rgba(97,241,172,0.08)]">
                  <Tag
                    size={15}
                    className="shrink-0 text-[#61F1AC] transition-transform duration-300 group-hover:rotate-[-8deg]"
                  />
                  <span className="text-xs font-medium text-[#D8E8E0]">
                    {genres}
                  </span>
                </div>

                {/* Release year */}
                <div className="group inline-flex items-center gap-2 rounded-full border border-[#61F1AC]/20 bg-[#0D1915] px-3 py-2 transition-all duration-300 hover:border-[#61F1AC]/60 hover:bg-[#11251C] hover:shadow-[0_0_14px_rgba(97,241,172,0.08)]">
                  <CalendarDays
                    size={15}
                    className="shrink-0 text-[#61F1AC] transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="text-xs font-medium text-[#D8E8E0]">
                    {year}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Cast carousel - reuses the user's existing component */}
      <section>
        <SectionHeading
          title={isSeries ? "Cast & Characters" : "Cast"}
          action={
            cast.length > 0 ? (
              <span className="text-[14px]  text-[#7C8790]">
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

      {/* Episodes: season selector + episode chips + featured episode only. */}
      {isSeries && (
        <section>
          <SectionHeading title="Episodes" />
          {seasons.length > 0 && (
            <div className="mb-6 gap-6 overflow-x-auto flex flex-wrap items-center border-b border-[#1C242B] pb-3">
              {seasons.map((season) => (
                <button
                  key={season.id || season.season_number}
                  type="button"
                  onClick={() => {
                    setSelectedSeason(Number(season.season_number));
                    setSelectedEpisodeNumber(1);
                  }}
                  className={`relative shrink-0 pb-3 text-sm transition ${Number(selectedSeason) === Number(season.season_number) ? "font-semibold text-white" : "text-[#7A7A7A] hover:text-white"}`}
                >
                  Season {season.season_number}
                  {selectedSeason === season.season_number && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#61F1AC]" />
                  )}
                </button>
              ))}
            </div>
          )}
          {seasons.length === 0 ? (
            <p className="mb-4 text-xs text-[#7D8790]">
              Season information is not available. Make sure the Series Detail
              page passes its TV details to OverviewTab.
            </p>
          ) : seasonLoading ? (
            <div className="flex gap-2 overflow-hidden pb-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 min-w-[70px] flex-1 animate-pulse rounded-lg border border-[#1C242B] bg-[#0B1116]"
                />
              ))}
            </div>
          ) : seasonEpisodes.length > 0 ? (
            <div className="relative mb-4">
              <button
                type="button"
                aria-label="Show earlier episodes"
                onClick={() => scrollEpisodes("left")}
                disabled={!canScrollEpisodesLeft}
                className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#2A353D] bg-[#0A0F13]/95 text-[#D8E8E0] shadow-lg transition hover:border-[#61F1AC]/60 hover:text-[#61F1AC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#61F1AC] disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>

              <div
                ref={episodeRowRef}
                onScroll={updateEpisodeScrollState}
                className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth px-12 py-1"
              >
                {seasonEpisodes.map((episode) => (
                  <button
                    key={episode.id || episode.episode_number}
                    type="button"
                    onClick={() =>
                      setSelectedEpisodeNumber(episode.episode_number)
                    }
                    className={`min-w-[70px] shrink-0 rounded-lg border px-3 py-2 text-center transition-colors ${Number(selectedEpisodeNumber) === Number(episode.episode_number) ? "border-[#61F1AC] bg-[#61F1AC]/10 text-[#61F1AC]" : "border-[#1C242B] bg-[#0A0F13] text-[#9AA4AD] hover:border-[#61F1AC]/40"}`}
                  >
                    <span className="block text-xs font-semibold">
                      E{episode.episode_number}
                    </span>
                    <span className="mt-1 block text-[10px] text-[#7D8790]">
                      {episode.vote_average
                        ? Number(episode.vote_average).toFixed(1)
                        : "—"}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-label="Show later episodes"
                onClick={() => scrollEpisodes("right")}
                disabled={!canScrollEpisodesRight}
                className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#2A353D] bg-[#0A0F13]/95 text-[#D8E8E0] shadow-lg transition hover:border-[#61F1AC]/60 hover:text-[#61F1AC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#61F1AC] disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <p className="mb-4 text-xs text-[#7D8790]">
              {episodeMessage || "Episode information is not available."}
            </p>
          )}

          {(() => {
            const episode = seasonEpisodes.find(
              (item) =>
                Number(item.episode_number) === Number(selectedEpisodeNumber),
            );
            if (!episode) return null;
            const episodeStill = episode.still_path
              ? `https://image.tmdb.org/t/p/w780${episode.still_path}`
              : backdropUrl;
            return (
              <Panel className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                  <div className="relative min-h-[220px] bg-[#05080A] md:min-h-[270px]">
                    {episodeStill && (
                      <img
                        src={episodeStill}
                        alt={
                          episode.name || `Episode ${episode.episode_number}`
                        }
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 rounded-md border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white">
                      S{selectedSeason}.E{episode.episode_number}
                    </div>
                  </div>
                  <div className="relative p-5 sm:p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-[#89939C]">
                      <span className="rounded-full bg-[#61F1AC]/10 px-2.5 py-1 font-semibold text-[#61F1AC]">
                        S{selectedSeason}.E{episode.episode_number}
                      </span>
                      {episode.air_date && (
                        <span>
                          {new Date(
                            `${episode.air_date}T00:00:00`,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="pr-8 text-lg font-semibold leading-snug text-[#F5F5F5] sm:text-xl">
                      {episode.name || `Episode ${episode.episode_number}`}
                    </h3>
                    <div className="mt-3 flex items-center gap-2 text-sm text-[#61F1AC]">
                      <Star size={17} fill="currentColor" />
                      <span className="font-semibold">
                        {episode.vote_average
                          ? Number(episode.vote_average).toFixed(1)
                          : "—"}
                      </span>
                      <span className="text-xs text-[#7D8790]">
                        ({formatVotes(episode.vote_count || 0)} votes)
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#A7B0B8]">
                      {episode.overview ||
                        "No description is available for this episode yet."}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#1C242B] pt-4 text-xs text-[#89939C]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={13} className="text-[#61F1AC]" />
                        {episode.runtime ? `${episode.runtime} min` : runtime}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-[#61F1AC]" />
                        Episode {episode.episode_number}
                      </span>
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })()}
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
                className="inline-flex items-center gap-1 text-[14px] font-medium text-[#A3AAB1] transition-colors hover:text-white"
              >
                View all <ExternalLink size={12} />
              </button>
            ) : null
          }
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* Rating summary */}
          <div className="rounded-2xl border border-[#262A2F] bg-[#05080A] p-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight tabular-nums text-[#ECEEF0]">
                {score ? Number(score).toFixed(1) : "—"}
              </span>
              <span className="text-sm text-[#7B838B]">/ 10</span>
            </div>
            <div className="mt-3 flex items-center gap-0.5 text-[#61F1AC]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  fill={star <= Math.round(score / 2) ? "currentColor" : "none"}
                  className={
                    star <= Math.round(score / 2) ? "" : "text-[#3A3F45]"
                  }
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[#7B838B]">
              {formatVotes(voteCount)} ratings
            </p>
            <div className="mt-5 space-y-2.5">
              {ratingBuckets.map((bucket) => (
                <div
                  key={bucket.star}
                  className="flex items-center gap-3 text-[11px] text-[#7B838B]"
                >
                  <span className="w-3 shrink-0 tabular-nums">
                    {bucket.star}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#262A2F]">
                    <div
                      className="h-full rounded-full bg-[#61F1AC] transition-[width] duration-700 ease-out"
                      style={{ width: `${bucket.percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums">
                    {bucket.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {reviewsLoading ? (
            <div className="flex gap-3 overflow-hidden py-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[216px] w-[290px] shrink-0 animate-pulse rounded-2xl border border-[#262A2F] bg-[#17191C] sm:w-[320px]"
                />
              ))}
            </div>
          ) : reviews.length ? (
            <div className="min-w-0">
              {reviewsError && (
                <p role="status" className="mb-2 text-xs text-[#7B838B]">
                  {reviewsError} Showing available provider reviews instead.
                </p>
              )}
              <div className="group relative">
                {reviews.length > 1 && (
                  <button
                    type="button"
                    aria-label="Show earlier reviews"
                    onClick={() => scrollReviews("left")}
                    className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#2E3338] bg-[#17191C]/95 text-[#C4CAD0] opacity-0 backdrop-blur transition duration-200 hover:border-[#3F464D] hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#61F1AC] group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                )}

                <div
                  ref={reviewCarouselRef}
                  onScroll={normalizeReviewCarousel}
                  onPointerEnter={() => {
                    reviewIsHoveredRef.current = true;
                  }}
                  onPointerLeave={() => {
                    reviewIsHoveredRef.current = false;
                  }}
                  onTouchStart={pauseReviewAutoScroll}
                  className="flex overflow-x-auto no-scrollbar scroll-smoot  py-10 [mask-image:linear-gradient(to_right,transparent,black_28px,black_calc(100%-28px),transparent)]"
                  aria-label="Community reviews"
                >
                  {carouselReviews.map(({ review, key }) => (
                    <ReviewCard key={key} review={review} />
                  ))}
                </div>

                {reviews.length > 1 && (
                  <button
                    type="button"
                    aria-label="Show later reviews"
                    onClick={() => scrollReviews("right")}
                    className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#2E3338] bg-[#17191C]/95 text-[#C4CAD0] opacity-0 backdrop-blur transition duration-200 hover:border-[#3F464D] hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#61F1AC] group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-[#262A2F] bg-[#17191C] p-6 text-center">
              <p className="text-sm font-medium text-[#ECEEF0]">
                {reviewsError ? "Reviews unavailable" : "No reviews yet"}
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[#7B838B]">
                {reviewsError ||
                  "Community reviews will appear here when they are available."}
              </p>
              {onOpenReviews && (
                <button
                  type="button"
                  onClick={onOpenReviews}
                  className="mt-4 rounded-lg border border-[#343A41] px-3 py-2 text-xs font-medium text-[#ECEEF0] transition hover:bg-[#262A2F]"
                >
                  Write a review
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Details */}
      <section className="space-y-4">
        <SectionHeading title="Details" />

        <Panel className="overflow-hidden rounded-2xl border border-[#202B32] bg-[#080D10] p-0 shadow-xl">
          {/* Main metadata */}
          <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
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
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-[#202B32] sm:mx-7" />

          {/* Additional information */}
<div className="border-t border-[#1C242B] px-5 py-6 sm:px-7">
  <div className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">

    {/* Original title */}
    <div className="group min-w-0 space-y-2">
      <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[#74818D]">
        Original title
      </span>

      <span className="block break-words text-[15px] font-medium leading-6 text-[#55E6B0] transition-colors duration-200 group-hover:text-[#7CF5C5]">
        {details.original_title ||
          details.original_name ||
          title ||
          "Not available"}
      </span>
    </div>

    {/* TMDB ID */}
    <div className="group min-w-0 space-y-2">
      <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[#74818D]">
        TMDB ID
      </span>

      <span className="block break-words text-[15px] font-medium leading-6 tabular-nums text-[#E4E9ED]">
        {details.id || id || "Not available"}
      </span>
    </div>

    {/* Production */}
    <div className="group min-w-0 space-y-2">
      <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[#74818D]">
        Production
      </span>

      <span className="block break-words text-[15px] font-medium leading-6 text-[#E4E9ED] transition-colors duration-200 group-hover:text-[#55E6B0]">
        {studio || "Not available"}
      </span>
    </div>

    {/* Source */}
    <div className="group min-w-0 space-y-2">
      <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[#74818D]">
        Source
      </span>

      <span className="block break-words text-[15px] font-medium leading-6 text-[#E4E9ED]">
        {source || "Not available"}
      </span>
    </div>

  </div>
</div>
        </Panel>
      </section>
    </div>
  );
}
