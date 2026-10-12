
import { Play } from "lucide-react";

export default function MediaItems({ movieData }) {
  const videos = (movieData?.videos?.results || []).filter(
    (video) => video.site === "YouTube"
  );

  const backdrops = movieData?.images?.backdrops || [];
  const posters = movieData?.images?.posters || [];

  const SectionTitle = ({ children, count }) => (
    <div className="mb-4 flex items-center gap-3">
      <h3 className="text-base font-semibold tracking-tight text-[#F5F5F5] sm:text-lg">
        {children}
      </h3>
      <span className="text-xs text-[#7A7A7A]">{count}</span>
    </div>
  );

  const EmptyState = ({ label }) => (
    <p className="py-5 text-sm text-[#7A7A7A]">
      No {label.toLowerCase()} available.
    </p>
  );

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
                  <div className="relative aspect-video overflow-hidden rounded-md border border-[#202020] bg-[#0B0B0B]">
                    <img
                      src={`https://img.youtube.com/vi/${video.key}/hqdefault.jpg`}
                      alt={video.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-80"
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white transition group-hover:scale-110">
                        <Play size={19} fill="white" />
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-1 text-sm font-medium text-[#F5F5F5]">
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
          <SectionTitle count={backdrops.length}>
            Backdrops
          </SectionTitle>

          {backdrops.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-3 pr-5 [scrollbar-width:thin] [scrollbar-color:#333_transparent] sm:gap-5">
              {backdrops.map((image, index) => (
                <div
                  key={image.file_path || index}
                  className="group w-[260px] shrink-0 sm:w-[340px] lg:w-[400px]"
                >
                  <div className="aspect-video overflow-hidden rounded-md border border-[#202020] bg-[#0B0B0B]">
                    <img
                      src={getTMDBImage(image.file_path, "w780")}
                      alt={`Movie backdrop ${index + 1}`}
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
          <SectionTitle count={posters.length}>
            Posters
          </SectionTitle>

          {posters.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-3 pr-5 [scrollbar-width:thin] [scrollbar-color:#333_transparent] sm:gap-5">
              {posters.map((image, index) => (
                <div
                  key={image.file_path || index}
                  className="group w-[125px] shrink-0 sm:w-[155px] lg:w-[175px]"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-md border border-[#202020] bg-[#0B0B0B]">
                    <img
                      src={getTMDBImage(image.file_path, "w500")}
                      alt={`Movie poster ${index + 1}`}
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