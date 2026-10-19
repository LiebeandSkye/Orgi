import React, { useState, useEffect } from "react";
import { Star, Bookmark, Play, SlidersHorizontal, BookOpen, Check } from "lucide-react";
import { isGuestInCollection, toggleGuestCollection } from "../../../utils/guestCollection";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import api from "../../../services/api";

export function StepPicksResults({
  medium,
  picks = [],
  onSelectPick,
  onRefine,
}) {
  const { user } = useAuth() || {};
  const { showToast, openAuthModal } = useToast();
  const [collectionMap, setCollectionMap] = useState({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const isBook = medium === "book";

  useEffect(() => {
    if (!picks || picks.length === 0) return;

    const token = localStorage.getItem("orgi_session");
    if (!token && !user) {
      const map = {};
      picks.forEach((p) => {
        map[p.id] = isGuestInCollection(p.provider || "tmdb", p.id);
      });
      setCollectionMap(map);
    } else {
      Promise.allSettled(
        picks.map((p) => api.get(`/collections/check/${p.provider || "tmdb"}/${p.id}`))
      ).then((results) => {
        const map = {};
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value?.data?.inCollection) {
            map[picks[idx].id] = true;
          }
        });
        setCollectionMap(map);
      });
    }
  }, [picks, user]);

  const handleToggleCollection = async (e, pick) => {
    e.stopPropagation();
    const token = localStorage.getItem("orgi_session");
    const itemProvider = pick.provider || "tmdb";
    const itemType = pick.type || (isBook ? "BOOK" : "MOVIE");

    if (!token && !user) {
      const next = toggleGuestCollection({
        external_id: pick.id,
        provider: itemProvider,
        type: itemType,
        title: pick.title,
        cover_url: pick.poster,
      });
      setCollectionMap((p) => ({ ...p, [pick.id]: next }));
      showToast({
        message: next ? "Saved to local collection." : "Removed from collection.",
        actionText: "Sign In to Sync",
        onAction: openAuthModal,
      });
      return;
    }

    try {
      const res = await api.post("/collections/toggle", {
        external_id: pick.id,
        provider: itemProvider,
        type: itemType,
        title: pick.title,
        cover_url: pick.poster,
      });
      if (res?.success) {
        const inCol = Boolean(res.data?.inCollection);
        setCollectionMap((p) => ({ ...p, [pick.id]: inCol }));
        showToast({
          message: inCol ? `Added "${pick.title}" to collection.` : `Removed from collection.`,
        });
      }
    } catch {
      showToast({ message: "Could not update collection." });
    }
  };

  const handleSaveAll = async () => {
    if (!picks || picks.length === 0) return;
    setIsSavingAll(true);

    const token = localStorage.getItem("orgi_session");
    const items = picks.map((pick) => ({
      external_id: String(pick.id),
      provider: pick.provider || "tmdb",
      type: pick.type || (isBook ? "BOOK" : "MOVIE"),
      title: pick.title,
      cover_url: pick.poster,
      status: "plan",
    }));

    if (token || user) {
      try {
        const res = await api.post("/collections/merge", { items });
        if (res?.success) {
          const nextMap = { ...collectionMap };
          picks.forEach((p) => {
            nextMap[p.id] = true;
          });
          setCollectionMap(nextMap);
          showToast({ message: "Saved all 3 picks to your collection!" });
        } else {
          showToast({ message: "Failed to save picks to collection." });
        }
      } catch {
        showToast({ message: "Could not save picks to server collection." });
      } finally {
        setIsSavingAll(false);
      }
    } else {
      items.forEach((item) => toggleGuestCollection(item));
      const nextMap = { ...collectionMap };
      picks.forEach((p) => {
        nextMap[p.id] = true;
      });
      setCollectionMap(nextMap);
      setIsSavingAll(false);
      showToast({
        message: "Saved all 3 picks to your local list!",
        actionText: "Sign In to Sync",
        onAction: openAuthModal,
      });
    }
  };

  const allSaved = picks.length > 0 && picks.every((p) => collectionMap[p.id]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <h1 className="text-center text-4xl sm:text-5xl font-light tracking-tight text-[#F5F5F5] mb-10">
        Your{" "}
        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]">
          3 picks
        </span>
      </h1>

      {/* Cards or Empty State */}
      {picks.length === 0 ? (
        <div className="py-16 px-6 text-center max-w-md mx-auto rounded-3xl border border-dashed border-[#1E262F] bg-[#0B0F13]/60">
          <p className="text-base text-[#F5F5F5] font-medium mb-2">
            No exact match found for this filter combination.
          </p>
          <p className="text-xs text-[#7A7A7A] mb-6 font-light leading-relaxed">
            Try loosening your vibe tags or choosing another format to discover recommendations.
          </p>
          <button
            type="button"
            onClick={onRefine}
            className="px-6 py-2.5 rounded-full bg-[#61F1AC] hover:bg-[#52deb0] text-black font-semibold text-xs inline-flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(97,241,172,0.25)]"
          >
            <SlidersHorizontal size={14} />
            <span>Adjust Preferences</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {picks.map((pick) => {
            const isCollected = Boolean(collectionMap[pick.id]);
            return (
              <div
                key={pick.id}
                onClick={() => onSelectPick(pick)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full rounded-3xl overflow-hidden bg-[#0B0F13] border border-[#1E262F] group-hover:border-[#61F1AC]/60 shadow-2xl group-hover:shadow-[0_0_40px_rgba(97,241,172,0.18)] transition-all duration-300">
                  <img
                    src={pick.poster}
                    alt={pick.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Bookmark */}
                  <button
                    type="button"
                    aria-label={isCollected ? "Remove from collection" : "Save to collection"}
                    onClick={(e) => handleToggleCollection(e, pick)}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-colors cursor-pointer ${
                      isCollected
                        ? "bg-[#61F1AC] text-black border-[#61F1AC]"
                        : "bg-black/60 border-white/20 text-white hover:bg-black/80"
                    }`}
                  >
                    <Bookmark size={16} className={isCollected ? "fill-black" : ""} />
                  </button>

                  {/* Rating, one small chip */}
                  {pick.rating && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-[#61F1AC]">
                      <Star size={12} className="fill-[#61F1AC]" />
                      {pick.rating}
                    </div>
                  )}
                </div>

                {/* Title + year only */}
                <div className="mt-4 px-1 text-center">
                  <h3 className="text-lg font-semibold text-[#F5F5F5] truncate group-hover:text-[#61F1AC] transition-colors">
                    {pick.title}
                  </h3>
                  {pick.year && <div className="text-sm text-[#7A7A7A] mt-0.5">{pick.year}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {picks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-12">
          <button
            type="button"
            onClick={onRefine}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#1E262F] bg-[#0B0F13] hover:border-[#61F1AC]/50 text-sm font-medium text-[#F5F5F5] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <SlidersHorizontal size={16} className="text-[#61F1AC]" />
            Refine
          </button>

          <button
            type="button"
            disabled={isSavingAll}
            onClick={handleSaveAll}
            className={`w-full sm:w-auto px-6 py-3 rounded-full border text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${
              allSaved
                ? "border-[#61F1AC]/50 bg-[#61F1AC]/15 text-[#61F1AC]"
                : "border-[#1E262F] bg-[#0B0F13] hover:border-white/20 text-[#C5C5C5] hover:text-white"
            }`}
          >
            {allSaved ? <Check size={16} className="stroke-[3]" /> : <Bookmark size={16} />}
            {isSavingAll ? "Saving..." : allSaved ? "Saved" : "Save all"}
          </button>
        </div>
      )}
    </div>
  );
}