import React, { useState } from "react";
import { Play, BookOpen, X } from "lucide-react";
import { getTmdbImageUrl } from "../../services/tmdb";

export default function MediaItems({ movieData, seriesData }) {
  const mediaItem = movieData || seriesData || {};
  const [selectedCover, setSelectedCover] = useState(null);

  const volumes = mediaItem?.volumes || [];
  const isBookOrManga =
    Array.isArray(mediaItem?.volumes) ||
    ["MANGA", "MANHWA", "MANHUA", "BOOK / NOVEL", "NOVELS", "BOOKS", "LIGHT-NOVELS"].includes(
      (mediaItem?.type || "").toUpperCase()
    );

  const videos = (mediaItem?.videos?.results || []).filter(
    (video) => video.site === "YouTube"
  );

  const backdrops = mediaItem?.images?.backdrops || [];
  const posters = mediaItem?.images?.posters || [];

  const SectionTitle = ({ children, count, subtitle }) => (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#1C1C1C] pb-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-light tracking-tight text-[#F5F5F5]">
          {children}
        </h3>
        {typeof count === "number" && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-tabular font-medium bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/30">
            {count}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-xs text-[#7A7A7A] font-light">{subtitle}</span>
      )}
    </div>
  );

  const EmptyState = ({ label }) => (
    <div className="py-12 px-6 rounded-[12px] border border-[#1C1C1C] bg-[#0B0B0B]/60 text-center">
      <p className="text-sm text-[#7A7A7A] font-light">
        No {label.toLowerCase()} available for this title.
      </p>
    </div>
  );

  if (isBookOrManga) {
    return (
      <section className="w-full bg-black text-[#F5F5F5]">
        <div className="py-2">
          <SectionTitle
            count={volumes.length}
            subtitle="Official Tankōbon, Volume & Edition Cover Art"
          >
            Volume &amp; Edition Covers
          </SectionTitle>

          {volumes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {volumes.map((vol, index) => {
                const volBadge =
                  vol.volume && vol.volume !== "Main"
                    ? `VOL. ${vol.volume}`
                    : `COVER ${index + 1}`;

                return (
                  <div
                    key={vol.id || index}
                    onClick={() => setSelectedCover(vol)}
                    className="group flex flex-col cursor-pointer transition-all"
                  >
                    {/* 2:3 Portrait Volume Cover Card */}
                    <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC] group-hover:shadow-[0_0_24px_rgba(97,241,172,0.14)] transition-all duration-300 mb-2.5">
                      <img
                        src={vol.cover}
                        alt={vol.title || `Volume ${vol.volume}`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Subtle top-left volume pill badge */}
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 group-hover:border-[#61F1AC]/60 transition-colors">
                        <span className="text-[10px] font-tabular font-semibold tracking-wider uppercase text-[#F5F5F5] group-hover:text-[#61F1AC] transition-colors">
                          {volBadge}
                        </span>
                      </div>

                      {/* Bottom dark gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#61F1AC]">
                          <BookOpen size={12} />
                          <span>View Cover</span>
                        </span>
                      </div>
                    </div>

                    {/* Volume Title */}
                    <h4 className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-[#61F1AC] transition-colors">
                      {vol.title || `Volume ${vol.volume}`}
                    </h4>

                    {/* Subtitle (Chapters count or edition info) */}
                    {vol.subtitle && (
                      <span className="text-xs text-[#7A7A7A] truncate font-light mt-0.5 font-tabular">
                        {vol.subtitle}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState label="volume covers" />
          )}
        </div>

        {/* Lightbox Modal for Full Cover Inspection */}
        {selectedCover && (
          <div
            onClick={() => setSelectedCover(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full bg-[#0B0B0B] border border-[#1C1C1C] rounded-[16px] overflow-hidden shadow-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1C1C1C]">
                <div>
                  <h4 className="text-sm font-semibold text-[#F5F5F5]">
                    {selectedCover.title}
                  </h4>
                  {selectedCover.subtitle && (
                    <p className="text-xs text-[#7A7A7A]">
                      {selectedCover.subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCover(null)}
                  className="w-8 h-8 rounded-full bg-[#141414] border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-[#050505] border border-[#1C1C1C]">
                <img
                  src={selectedCover.cover}
                  alt={selectedCover.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="w-full bg-black text-[#F5F5F5]">
      <div className="space-y-8 py-6 sm:space-y-10 sm:py-8">
        {/* Videos */}
        <section>
          <SectionTitle count={videos.length}>Videos</SectionTitle>

          {videos.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-3 pr-5 [scrollbar-width:thin] [scrollbar-color:#333_transparent] sm:gap-5">
              {videos.map((video) => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group w-[240px] shrink-0 sm:w-[300px] lg:w-[340px]"
                >
                  <div className="relative aspect-video overflow-hidden rounded-[12px] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 bg-[#0B0B0B] transition-colors">
                    <img
                      src={`https://img.youtube.com/vi/${video.key}/hqdefault.jpg`}
                      alt={video.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-80"
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/80 border border-white/15 group-hover:border-[#61F1AC] text-white transition group-hover:scale-110">
                        <Play size={19} fill="white" />
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-1 text-sm font-medium text-[#F5F5F5] group-hover:text-[#61F1AC] transition-colors">
                    {video.name}
                  </p>
                  <p className="mt-1 text-xs text-[#7A7A7A]">
                    {video.type || "Video"}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState label="Videos" />
          )}
        </section>

        {/* Backdrops */}
        <section>
          <SectionTitle count={backdrops.length}>Backdrops</SectionTitle>

          {backdrops.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-3 pr-5 [scrollbar-width:thin] [scrollbar-color:#333_transparent] sm:gap-5">
              {backdrops.map((image, index) => (
                <div
                  key={image.file_path || index}
                  className="group w-[260px] shrink-0 sm:w-[340px] lg:w-[400px]"
                >
                  <div className="aspect-video overflow-hidden rounded-[12px] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 bg-[#0B0B0B] transition-colors">
                    <img
                      src={getTmdbImageUrl(image.file_path, "w780")}
                      alt={`Backdrop ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Backdrops" />
          )}
        </section>

        {/* Posters */}
        <section>
          <SectionTitle count={posters.length}>Posters</SectionTitle>

          {posters.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-3 pr-5 [scrollbar-width:thin] [scrollbar-color:#333_transparent] sm:gap-5">
              {posters.map((image, index) => (
                <div
                  key={image.file_path || index}
                  className="group w-[125px] shrink-0 sm:w-[155px] lg:w-[175px]"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-[12px] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 bg-[#0B0B0B] transition-colors">
                    <img
                      src={getTmdbImageUrl(image.file_path, "w500")}
                      alt={`Poster ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Posters" />
          )}
        </section>
      </div>
    </section>
  );
}