import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, RefreshCw, AlertCircle, ArrowUp, Sparkles } from "lucide-react";
import { useReviewFilters, CATEGORIES } from "../hooks/useReviewFilters";
import { useReviewsFeed } from "../hooks/useReviewsFeed";
import { useBookmarks } from "../hooks/useBookmarks";
import { ReviewsHero } from "../components/reviews/ReviewsHero";
import { BrowseNav } from "../components/reviews/BrowseNav";
import { ReviewFilters } from "../components/reviews/ReviewFilters";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { ReviewCardSkeleton } from "../components/reviews/ReviewCardSkeleton";
import { Pagination } from "../components/reviews/Pagination";
import { TopRatedRail } from "../components/reviews/TopRatedRail";
import { FeaturedReview } from "../components/reviews/FeaturedReview";
import { MobileCategoryChips } from "../components/reviews/MobileCategoryChips";
import { MobileFilterSheet } from "../components/reviews/MobileFilterSheet";
import { ReviewDetailModal } from "../components/reviews/ReviewDetailModal";

export function ReviewsPage() {
  const { source, titleId, reviewId } = useParams();
  const feedSectionRef = useRef(null);

  const {
    category,
    sort,
    rating,
    type,
    q,
    page,
    activeFilterCount,
    setCategory,
    setSort,
    setRating,
    setType,
    setSearch,
    setPage,
    resetFilters,
  } = useReviewFilters();

  const {
    items,
    capabilities,
    total,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    retry,
  } = useReviewsFeed({ category, sort, rating, type, q, page, limit: 50 });

  const { isBookmarked, toggleBookmark, toastMessage } = useBookmarks();

  // Scroll to top button visibility state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Mobile filter sheet state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Selected item for review detail modal
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Featured review & hero backdrop image
  const [featuredData, setFeaturedData] = useState({
    item: null,
    backdropUrl: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    fetch("/api/reviews/featured")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data?.success) {
          setFeaturedData({
            item: data.item || null,
            backdropUrl: data.heroBackdropUrl || data.item?.backdropUrl || null,
            isLoading: false,
            error: null,
          });
        } else if (mounted) {
          setFeaturedData((prev) => ({
            ...prev,
            isLoading: false,
            error: "Featured review unavailable",
          }));
        }
      })
      .catch((err) => {
        if (mounted) {
          setFeaturedData((prev) => ({
            ...prev,
            isLoading: false,
            error: err.message,
          }));
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Handle direct URL params (/reviews/:source/:titleId/:reviewId?)
  useEffect(() => {
    if (source && titleId) {
      setSelectedReview({
        id: `${source}:${titleId}:${reviewId || "title"}`,
        source,
        titleId,
      });
      setDetailModalOpen(true);
    }
  }, [source, titleId, reviewId]);

  const handleOpenDetail = (item) => {
    setSelectedReview(item);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
  };

  // Smooth scroll to top of feed when switching page or category
  const scrollToFeedTop = () => {
    if (feedSectionRef.current) {
      const navHeight = 64;
      const topOffset =
        feedSectionRef.current.getBoundingClientRect().top +
        window.scrollY -
        navHeight -
        16;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
    } else {
      window.scrollTo({ top: 230, behavior: "smooth" });
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    scrollToFeedTop();
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    scrollToFeedTop();
  };

  // Section header title logic:
  // RESULTS FOR "query" when searching, or CATEGORY REVIEWS (e.g. ANIME REVIEWS), or LATEST REVIEWS
  let sectionHeader = "LATEST REVIEWS";
  if (q && q.trim()) {
    sectionHeader = `RESULTS FOR "${q.trim()}"`;
  } else if (category && category !== "all") {
    const currentCatObj = CATEGORIES.find((c) => c.id === category);
    sectionHeader = `${(currentCatObj?.label || category).toUpperCase()} REVIEWS`;
  }

  // Is current view already the default unfiltered "All Reviews / Most recent"?
  const isDefaultView =
    category === "all" &&
    sort === "recent" &&
    (rating === "all" || !rating) &&
    (type === "all" || !type) &&
    !q &&
    page === 1;

  const handleViewAll = () => {
    setCategory("all");
    resetFilters();
    scrollToFeedTop();
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] selection:bg-[#61F1AC]/25 selection:text-[#61F1AC]">
      {/* Screen reader live announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!isLoading && `Page ${currentPage} of ${totalPages}, ${total} reviews for ${category}`}
      </div>

      {/* Hero Banner */}
      <ReviewsHero
        backdropUrl={featuredData.backdropUrl}
        initialQuery={q}
        onSearchChange={setSearch}
      />

      {/* Mobile Sticky Category Chips Bar */}
      <MobileCategoryChips
        currentCategory={category}
        onSelectCategory={handleCategoryChange}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setMobileFiltersOpen(true)}
      />

      {/* Three-Column Desktop / Tablet Responsive Grid */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-[120px] py-8">
        <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_320px] gap-8 items-start">
          {/* Left Sidebar (Sticky): Browse + Filters */}
          <aside
            aria-label="Browse and Filters"
            className="hidden md:flex flex-col sticky top-[calc(var(--nav-h,64px)+16px)] self-start max-h-[calc(100vh-var(--nav-h,64px)-32px)] overflow-y-auto no-scrollbar overscroll-contain pr-1"
          >
            <BrowseNav
              currentCategory={category}
              onSelectCategory={handleCategoryChange}
            />

            <ReviewFilters
              sort={sort}
              onSortChange={setSort}
              rating={rating}
              onRatingChange={setRating}
              type={type}
              onTypeChange={setType}
              capabilities={capabilities}
            />
          </aside>

          {/* Center Feed (Scrolls with page) */}
          <section
            ref={feedSectionRef}
            aria-labelledby="feed-heading"
            className="w-full min-w-0"
          >
            {/* Feed Section Header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-3">
                <h2
                  id="feed-heading"
                  className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#7A7A7A]"
                >
                  {sectionHeader}
                </h2>
                {totalPages > 1 && (
                  <span className="text-[11px] text-[#B5B5B5] font-tabular">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </div>

              {!isDefaultView && (
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="inline-flex items-center gap-1 text-[13px] text-[#B5B5B5] hover:text-[#61F1AC] transition-colors cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* Error State */}
            {error && !isLoading && items.length === 0 && (
              <div className="bg-[#0B0B0B] border border-rose-500/20 rounded-xl p-8 text-center my-6">
                <AlertCircle size={28} className="text-rose-400 mx-auto mb-3" />
                <h3 className="text-[16px] font-medium text-[#F5F5F5] mb-1">
                  Unable to load reviews
                </h3>
                <p className="text-[13px] text-[#B5B5B5] max-w-sm mx-auto mb-4">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#61F1AC] text-[#000000] font-semibold text-[13px] hover:bg-[#61F1AC]/90 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Try again</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && items.length === 0 && (
              <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-12 text-center my-6">
                <Sparkles size={28} className="text-[#7A7A7A] mx-auto mb-3" />
                <h3 className="text-[16px] font-medium text-[#F5F5F5] mb-1">
                  No reviews match these filters
                </h3>
                <p className="text-[13px] text-[#B5B5B5] max-w-xs mx-auto mb-5">
                  Try clearing your search query or loosening minimum rating filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#61F1AC] text-[#61F1AC] text-[13px] font-medium hover:bg-[#61F1AC]/[0.12] transition-colors cursor-pointer"
                >
                  <span>Reset filters</span>
                </button>
              </div>
            )}

            {/* Reviews Cards List or Skeletons */}
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <>
                  <ReviewCardSkeleton />
                  <ReviewCardSkeleton />
                  <ReviewCardSkeleton />
                </>
              ) : (
                items.map((item) => (
                  <ReviewCard
                    key={item.id}
                    item={item}
                    isBookmarked={isBookmarked(item.id)}
                    onToggleBookmark={toggleBookmark}
                    onOpenDetail={handleOpenDetail}
                  />
                ))
              )}
            </div>

            {/* Pagination System */}
            {!isLoading && !error && items.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            )}
          </section>

          {/* Right Rail (Sticky on Desktop lg+): Top Rated + Featured */}
          <aside
            aria-label="Top rated and featured reviews"
            className="hidden lg:flex flex-col sticky top-[calc(var(--nav-h,64px)+16px)] self-start max-h-[calc(100vh-var(--nav-h,64px)-32px)] overflow-y-auto no-scrollbar overscroll-contain pl-1"
          >
            <TopRatedRail
              category={category}
              onOpenDetail={handleOpenDetail}
            />

            <FeaturedReview
              featured={featuredData.item}
              isLoading={featuredData.isLoading}
              error={featuredData.error}
              onOpenDetail={handleOpenDetail}
            />
          </aside>
        </div>
      </main>

      {/* Mobile Filter Bottom Sheet */}
      <MobileFilterSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        sort={sort}
        rating={rating}
        type={type}
        capabilities={capabilities}
        totalCount={total}
        onApplyFilters={({ sort, rating, type }) => {
          setSort(sort);
          setRating(rating);
          setType(type);
          scrollToFeedTop();
        }}
        onResetFilters={() => {
          resetFilters();
          scrollToFeedTop();
        }}
      />

      {/* Review Detail Modal */}
      <ReviewDetailModal
        item={selectedReview}
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
      />

      {/* Floating Bookmark Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#0B0B0B] border border-[#61F1AC]/50 text-[#F5F5F5] text-[13px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Scroll to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Scroll to top"
        className={`fixed bottom-6 right-6 z-40 w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#101010]/90 hover:bg-[#181818] text-[#8A8A8A] hover:text-[#61F1AC] border border-[#222222] hover:border-[#61F1AC]/50 shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
          showScrollTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}
