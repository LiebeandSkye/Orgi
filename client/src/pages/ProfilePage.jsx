import React, { useState, useEffect, useCallback, useMemo } from "react"; 
import { Link } from "react-router-dom"; 
import { 
  Star, 
  ArrowUpRight, 
  Film, 
  BookOpen, 
  Bookmark, 
  Sparkles, 
  Heart, 
  Activity, 
  Layers, 
  LogIn, 
  CheckCircle2, 
  ExternalLink 
} from "lucide-react"; 
import { useAuth } from "../context/AuthContext"; 
import { profileApi } from "../feature/profile/services/profileApi"; 
import api from "../services/api"; 
import { ProfileCard } from "../feature/profile/components/ProfileCard"; 
import { EditProfileModal } from "../feature/profile/components/EditProfileModal"; 
import { CardSkeletonGrid } from "../components/ui/CardSkeleton"; 
import { FormattedText } from "../components/common/FormattedText"; 
import { useToast } from "../context/ToastContext"; 

const DEFAULT_AVATAR = "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"; 

const GUEST_PROFILE = { 
  user_name: "Unnamed Orgi", 
  profile_url: DEFAULT_AVATAR, 
  current_status: "Online", 
  email: "hello@gmail.com", 
  setting_preference: { 
    bio: "Collecting stories, one frame at a time.", 
  }, 
}; 

function timeAgo(dateStr) { 
  if (!dateStr) return ""; 
  const now = new Date(); 
  const past = new Date(dateStr); 
  const diffSec = Math.floor((now - past) / 1000); 
  if (diffSec < 60) return "just now"; 
  const diffMin = Math.floor(diffSec / 60); 
  if (diffMin < 60) return `${diffMin}m ago`; 
  const diffHr = Math.floor(diffMin / 60); 
  if (diffHr < 24) return `${diffHr}h ago`; 
  const diffDay = Math.floor(diffHr / 24); 
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`; 
  const diffWeek = Math.floor(diffDay / 7); 
  if (diffWeek < 5) return `${diffWeek} ${diffWeek === 1 ? "week" : "weeks"} ago`; 
  const diffMonth = Math.floor(diffDay / 30); 
  if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? "month" : "months"} ago`; 
  return `${Math.floor(diffDay / 365)}y ago`; 
} 

function getItemLink(item) { 
  if (!item) return "#"; 
  const type = (item.type || "").toLowerCase(); 
  const id = item.external_id || item.externalId || item.id; 
  if (type === "movie") return `/movie/${id}`; 
  if (type === "series") return `/series/${id}`; 
  if (["book", "novel", "manga", "manhwa", "manhua"].includes(type)) { 
    const cat = type === "book" || type === "novel" ? "novels" : type; 
    return `/books/${cat}/${id}`; 
  } 
  return `/movie/${id}`; 
} 

export function ProfilePage() { 
  const { user, userProfile, refreshProfile } = useAuth(); 
  const { showToast } = useToast(); 
  const [profile, setProfile] = useState(userProfile); 
  const [isEditing, setIsEditing] = useState(false); 
  const [activeTab, setActiveTab] = useState("favorites"); 

  const [reviews, setReviews] = useState([]); 
  const [collections, setCollections] = useState([]); 
  const [likes, setLikes] = useState([]); 
  const [isLoadingData, setIsLoadingData] = useState(Boolean(user)); 

  const loadUserData = useCallback(async () => { 
    if (!user?.id) { 
      setIsLoadingData(false); 
      return; 
    } 

    setIsLoadingData(true); 
    try { 
      const [profileRes, reviewsRes, collectionsRes, likesRes] = await Promise.allSettled([ 
        profileApi.get(user.id), 
        api.get("/reviews/user/my"), 
        api.get("/collections"), 
        api.get("/reviews/user/likes"), 
      ]); 

      if (profileRes.status === "fulfilled" && profileRes.value?.data) { 
        setProfile(profileRes.value.data); 
      } 
      if (reviewsRes.status === "fulfilled" && reviewsRes.value?.data) { 
        setReviews(reviewsRes.value.data || []); 
      } 
      if (collectionsRes.status === "fulfilled" && collectionsRes.value?.data) { 
        setCollections(collectionsRes.value.data || []); 
      } 
      if (likesRes.status === "fulfilled" && likesRes.value?.data) { 
        setLikes(likesRes.value.data || []); 
      } 
    } catch (err) { 
      console.error("Error loading profile data:", err); 
    } finally { 
      setIsLoadingData(false); 
    } 
  }, [user]); 

  useEffect(() => { 
    if (user?.id) { 
      loadUserData(); 
    } else { 
      setProfile(null); 
      setReviews([]); 
      setCollections([]); 
      setLikes([]); 
      setIsLoadingData(false); 
    } 
  }, [user, loadUserData]); 

  const handleSave = async (updatedData) => { 
    if (!user) { 
      setProfile((prev) => ({ 
        ...(prev || GUEST_PROFILE), 
        ...updatedData, 
        setting_preference: { 
          ...(prev?.setting_preference || {}), 
          bio: updatedData.bio, 
        }, 
      })); 
      setIsEditing(false); 
      return; 
    } 

    try { 
      const res = await profileApi.update(updatedData); 
      if (res?.success && res.data) { 
        setProfile(res.data); 
        if (refreshProfile) refreshProfile(); 
      } 
      setIsEditing(false); 
    } catch (err) { 
      console.error("Failed to update profile:", err); 
      showToast({ message: err.message || "Failed to update profile" }); 
    } 
  }; 

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); 
  const [isUploadingBanner, setIsUploadingBanner] = useState(false); 

  const handleAvatarChange = async (dataUrl) => { 
    setProfile((prev) => ({ 
      ...(prev || GUEST_PROFILE), 
      profile_url: dataUrl, 
    })); 

    if (!user) return; 

    setIsUploadingAvatar(true); 
    try { 
      const res = await profileApi.uploadImage({ file: dataUrl, type: "avatar" }); 
      if (res?.success && res.data?.url) { 
        setProfile((prev) => ({ 
          ...prev, 
          profile_url: res.data.url, 
        })); 
        if (refreshProfile) refreshProfile(); 
      } 
    } catch (err) { 
      console.error("Failed to upload avatar:", err); 
      showToast({ message: err.message || "Failed to upload avatar" }); 
    } finally { 
      setIsUploadingAvatar(false); 
    } 
  }; 

  const handleBannerChange = async (dataUrl) => { 
    setProfile((prev) => ({ 
      ...(prev || GUEST_PROFILE), 
      banner_url: dataUrl, 
    })); 

    if (!user) return; 

    setIsUploadingBanner(true); 
    try { 
      const res = await profileApi.uploadImage({ file: dataUrl, type: "banner" }); 
      if (res?.success && res.data?.url) { 
        setProfile((prev) => ({ 
          ...prev, 
          banner_url: res.data.url, 
        })); 
        if (refreshProfile) refreshProfile(); 
      } 
    } catch (err) { 
      console.error("Failed to upload banner:", err); 
      showToast({ message: err.message || "Failed to upload banner" }); 
    } finally { 
      setIsUploadingBanner(false); 
    } 
  }; 

  const displayProfile = profile || userProfile || GUEST_PROFILE; 

  // Compute real stats from user data
  const stats = useMemo(() => { 
    if (!user) { 
      return { 
        filmsRated: 0, 
        booksRead: 0, 
        avgRating: "—", 
        streak: 0, 
      }; 
    } 

    const filmsRated = reviews.filter((r) => { 
      const t = (r.items?.type || "").toLowerCase(); 
      return t === "movie" || t === "series"; 
    }).length; 

    const booksRead = collections.filter((c) => { 
      const t = (c.type || "").toLowerCase(); 
      const isBook = ["book", "novel", "manga", "manhwa", "manhua"].includes(t); 
      return isBook && c.status === "completed"; 
    }).length; 

    const ratedReviews = reviews.filter((r) => typeof r.score === "number" && r.score > 0); 
    const avgRating = 
      ratedReviews.length > 0 
        ? (ratedReviews.reduce((acc, r) => acc + r.score, 0) / ratedReviews.length).toFixed(1) 
        : "—"; 

    // Streak / days active calculation based on real dates
    let streak = 0; 
    if (displayProfile?.created_at) { 
      const created = new Date(displayProfile.created_at); 
      const days = Math.max(1, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))); 
      streak = days; 
    } else if (reviews.length > 0 || collections.length > 0) { 
      streak = 1; 
    } 

    return { 
      filmsRated, 
      booksRead, 
      avgRating, 
      streak, 
    }; 
  }, [user, reviews, collections, displayProfile?.created_at]); 

  // Compute Favorites (top-rated reviewed titles or completed collection items)
  const favorites = useMemo(() => { 
    const reviewItems = reviews 
      .filter((r) => r.items && typeof r.score === "number" && r.score >= 7) 
      .sort((a, b) => (b.score || 0) - (a.score || 0)) 
      .map((r) => ({ 
        id: r.items.id || r.id, 
        title: r.items.title, 
        cover_url: r.items.cover_url, 
        type: r.items.type, 
        external_id: r.items.external_id, 
        provider: r.items.provider, 
        score: r.score, 
        created_at: r.created_at, 
      })); 

    if (reviewItems.length > 0) return reviewItems; 

    // Fallback to completed collection items if no high reviews yet
    return collections 
      .filter((c) => c.status === "completed") 
      .map((c) => ({ 
        id: c.itemId || c.id, 
        title: c.title, 
        cover_url: c.coverUrl, 
        type: c.type, 
        external_id: c.externalId, 
        provider: c.provider, 
        score: null, 
        created_at: c.createdAt, 
      })); 
  }, [reviews, collections]); 

  // Watchlist items (status === 'plan')
  const watchlistItems = useMemo(() => { 
    return collections.filter((c) => c.status === "plan"); 
  }, [collections]); 

  // Books items (collection or reviews of books/manga/manhwa)
  const bookItems = useMemo(() => { 
    return collections.filter((c) => { 
      const t = (c.type || "").toLowerCase(); 
      return ["book", "novel", "manga", "manhwa", "manhua"].includes(t); 
    }); 
  }, [collections]); 

  const tabs = [ 
    { key: "reviews", label: "Reviews" }, 
    { key: "watchlist", label: "Watchlist" }, 
    { key: "books", label: "Books" }, 
    { key: "favorites", label: "Favorites" }, 
    { key: "activity", label: "Activity" }, 
  ]; 

  return ( 
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24 pt-8"> 
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"> 
        {/* Profile Card Header */} 
        <ProfileCard 
          profile={displayProfile} 
          onEdit={() => setIsEditing(true)} 
          onAvatarChange={handleAvatarChange} 
          onBannerChange={handleBannerChange} 
          isUploadingAvatar={isUploadingAvatar} 
          isUploadingBanner={isUploadingBanner} 
          isGuest={!user} 
        /> 

        {/* Stats Row */} 
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-10 border-b border-[#1C1C1C] text-center"> 
          <div className="flex flex-col items-center justify-center"> 
            <span className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] font-tabular tracking-tight"> 
              {stats.filmsRated} 
            </span> 
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7A7A] mt-2"> 
              Films Rated 
            </span> 
          </div> 
          <div className="flex flex-col items-center justify-center"> 
            <span className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] font-tabular tracking-tight"> 
              {stats.booksRead} 
            </span> 
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7A7A] mt-2"> 
              Books Read 
            </span> 
          </div> 
          <div className="flex flex-col items-center justify-center"> 
            <span className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] font-tabular tracking-tight"> 
              {stats.avgRating} 
            </span> 
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7A7A] mt-2"> 
              Avg Rating 
            </span> 
          </div> 
          <div className="flex flex-col items-center justify-center"> 
            <span className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] font-tabular tracking-tight"> 
              {stats.streak} 
            </span> 
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7A7A] mt-2"> 
              Day Streak 
            </span> 
          </div> 
        </div> 

        {/* Tab Navigation */} 
        <div className="flex items-center gap-8 border-b border-[#1C1C1C] text-sm font-medium mt-8 overflow-x-auto no-scrollbar"> 
          {tabs.map((tab) => { 
            const isActive = activeTab === tab.key; 
            return ( 
              <button 
                key={tab.key} 
                type="button" 
                onClick={() => setActiveTab(tab.key)} 
                className={`pb-3 relative transition-colors cursor-pointer select-none whitespace-nowrap ${ 
                  isActive ? "text-[#F5F5F5] font-semibold" : "text-[#7A7A7A] hover:text-[#B5B5B5]" 
                }`} 
              > 
                <span>{tab.label}</span> 
                {isActive && ( 
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#61F1AC] rounded-full shadow-[0_0_10px_rgba(97,241,172,0.8)]" /> 
                )} 
              </button> 
            ); 
          })} 
        </div> 

        {/* Tab Content */} 
        <div className="pt-8"> 
          {isLoadingData ? ( 
            <CardSkeletonGrid count={5} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4" /> 
          ) : ( 
            <> 
              {/* FAVORITES TAB */} 
              {activeTab === "favorites" && ( 
                <div className="space-y-12"> 
                  {/* Top Favorites Section */} 
                  <div> 
                    <div className="flex items-center justify-between mb-4"> 
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7A7A]"> 
                        Favorites 
                      </h3> 
                      {favorites.length > 5 && ( 
                        <button 
                          type="button" 
                          onClick={() => setActiveTab("watchlist")} 
                          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#7A7A7A] hover:text-[#F5F5F5] transition-colors cursor-pointer" 
                        > 
                          <span>View All</span> 
                          <ArrowUpRight size={12} /> 
                        </button> 
                      )} 
                    </div> 

                    {favorites.length === 0 ? ( 
                      <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-10 text-center"> 
                        <Sparkles size={28} className="mx-auto mb-3 text-[#333333]" /> 
                        <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1"> 
                          No Favorites Added Yet 
                        </h4> 
                        <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mb-5"> 
                          Rate movies, series, or books 7+ or mark them as completed to highlight them here on your showcase. 
                        </p> 
                        <Link 
                          to="/movies" 
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#141414] border border-[#222222] text-[#F5F5F5] hover:border-[#61F1AC]/50 transition-colors cursor-pointer" 
                        > 
                          <Film size={13} className="text-[#61F1AC]" /> 
                          <span>Browse Media</span> 
                        </Link> 
                      </div> 
                    ) : ( 
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"> 
                        {favorites.slice(0, 5).map((item) => ( 
                          <div key={item.id} className="group flex flex-col"> 
                            <Link 
                              to={getItemLink(item)} 
                              className="block aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#121212] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.15)] transition-all duration-300 relative" 
                            > 
                              <img 
                                src={ 
                                  item.cover_url || 
                                  item.coverUrl || 
                                  "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover" 
                                } 
                                alt={item.title} 
                                loading="lazy" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              /> 
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" /> 
                            </Link> 

                            <div className="mt-2.5 flex items-start justify-between gap-2"> 
                              <div className="min-w-0 flex-1"> 
                                <Link to={getItemLink(item)} className="block"> 
                                  <h4 className="text-xs sm:text-sm font-medium text-[#F5F5F5] truncate group-hover:text-[#61F1AC] transition-colors"> 
                                    {item.title} 
                                  </h4> 
                                </Link> 
                                <span className="text-[11px] text-[#7A7A7A]"> 
                                  {item.type || ""} 
                                </span> 
                              </div> 

                              {item.score && ( 
                                <div className="flex items-center gap-1 text-[#61F1AC] font-semibold text-xs shrink-0 pt-0.5"> 
                                  <Star size={11} className="fill-[#61F1AC] text-[#61F1AC]" /> 
                                  <span>{Number(item.score).toFixed(1)}</span> 
                                </div> 
                              )} 
                            </div> 
                          </div> 
                        ))} 
                      </div> 
                    )} 
                  </div> 

                  {/* Recent Reviews Section */} 
                  <div> 
                    <div className="flex items-center justify-between mb-4"> 
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7A7A]"> 
                        Recent Reviews 
                      </h3> 
                      {reviews.length > 3 && ( 
                        <button 
                          type="button" 
                          onClick={() => setActiveTab("reviews")} 
                          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#7A7A7A] hover:text-[#F5F5F5] transition-colors cursor-pointer" 
                        > 
                          <span>View All</span> 
                          <ArrowUpRight size={12} /> 
                        </button> 
                      )} 
                    </div> 

                    {reviews.length === 0 ? ( 
                      <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-10 text-center"> 
                        <Star size={28} className="mx-auto mb-3 text-[#333333]" /> 
                        <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1"> 
                          No Reviews Written Yet 
                        </h4> 
                        <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mb-5"> 
                          Post your first critique to start your review timeline. 
                        </p> 
                        <Link 
                          to="/feed" 
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#141414] border border-[#222222] text-[#F5F5F5] hover:border-[#61F1AC]/50 transition-colors cursor-pointer" 
                        > 
                          <span>Explore Feed</span> 
                        </Link> 
                      </div> 
                    ) : ( 
                      <div className="space-y-3"> 
                        {reviews.slice(0, 3).map((rev) => { 
                          const item = rev.items; 
                          return ( 
                            <div 
                              key={rev.id} 
                              className="bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#282828] rounded-xl p-4 sm:p-5 flex gap-4 transition-all duration-200" 
                            > 
                              <Link 
                                to={getItemLink(item)} 
                                className="w-14 h-20 sm:w-16 sm:h-22 rounded-lg overflow-hidden bg-[#141414] border border-[#202020] shrink-0 block" 
                              > 
                                <img 
                                  src={ 
                                    item?.cover_url || 
                                    "https://via.placeholder.com/150x220/141414/7A7A7A?text=No+Cover" 
                                  } 
                                  alt={item?.title || "Cover"} 
                                  loading="lazy" 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                /> 
                              </Link> 
                              <div className="flex-1 min-w-0 flex flex-col justify-between"> 
                                <div> 
                                  <div className="flex items-start justify-between gap-2 mb-1.5"> 
                                    <div className="flex items-baseline gap-2 truncate"> 
                                      <Link 
                                        to={getItemLink(item)} 
                                        className="text-sm sm:text-base font-semibold text-[#F5F5F5] hover:text-[#61F1AC] transition-colors truncate" 
                                      > 
                                        {item?.title || "Untitled Media"} 
                                      </Link> 
                                      <span className="text-xs text-[#7A7A7A] shrink-0 font-light"> 
                                        {item?.type || ""} 
                                      </span> 
                                    </div> 
                                    {rev.score && ( 
                                      <div className="flex items-center gap-1 text-[#61F1AC] font-semibold text-xs shrink-0"> 
                                        <Star size={12} className="fill-[#61F1AC] text-[#61F1AC]" /> 
                                        <span>{Number(rev.score).toFixed(1)}</span> 
                                      </div> 
                                    )} 
                                  </div> 
                                  <div className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed line-clamp-2 sm:line-clamp-3 break-words"> 
                                    <FormattedText content={rev.content} isExcerpt={true} /> 
                                  </div> 
                                </div> 
                                <div className="flex items-center gap-2 text-[11px] text-[#7A7A7A] mt-3"> 
                                  <span>{timeAgo(rev.created_at)}</span> 
                                  <span>·</span> 
                                  <span> 
                                    {rev.likes || 0} {rev.likes === 1 ? "like" : "likes"} 
                                  </span> 
                                </div> 
                              </div> 
                            </div> 
                          ); 
                        })} 
                      </div> 
                    )} 
                  </div> 
                </div> 
              )} 

              {/* REVIEWS TAB */} 
              {activeTab === "reviews" && ( 
                <div> 
                  <div className="flex items-center justify-between mb-4"> 
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7A7A]"> 
                      All Reviews Written ({reviews.length}) 
                    </h3> 
                  </div> 
                  {reviews.length === 0 ? ( 
                    <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-12 text-center"> 
                      <Star size={32} className="mx-auto mb-3 text-[#333333]" /> 
                      <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1"> 
                        No Reviews Written Yet 
                      </h4> 
                      <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mb-5"> 
                        Rate and review any title across movies, series, or books to build your profile portfolio. 
                      </p> 
                      <Link 
                        to="/movies" 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#141414] border border-[#222222] text-[#F5F5F5] hover:border-[#61F1AC]/50 transition-colors cursor-pointer" 
                      > 
                        <Film size={13} className="text-[#61F1AC]" /> 
                        <span>Browse Media</span> 
                      </Link> 
                    </div> 
                  ) : ( 
                    <div className="space-y-3"> 
                      {reviews.map((rev) => { 
                        const item = rev.items; 
                        return ( 
                          <div 
                            key={rev.id} 
                            className="bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#282828] rounded-xl p-4 sm:p-5 flex gap-4 transition-all duration-200" 
                          > 
                            <Link 
                              to={getItemLink(item)} 
                              className="w-14 h-20 sm:w-16 sm:h-22 rounded-lg overflow-hidden bg-[#141414] border border-[#202020] shrink-0 block" 
                            > 
                              <img 
                                src={ 
                                  item?.cover_url || 
                                  "https://via.placeholder.com/150x220/141414/7A7A7A?text=No+Cover" 
                                } 
                                alt={item?.title || "Cover"} 
                                loading="lazy" 
                                referrerPolicy="no-referrer" 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                              /> 
                            </Link> 
                            <div className="flex-1 min-w-0 flex flex-col justify-between"> 
                              <div> 
                                <div className="flex items-start justify-between gap-2 mb-1.5"> 
                                  <div className="flex items-baseline gap-2 truncate"> 
                                    <Link 
                                      to={getItemLink(item)} 
                                      className="text-sm sm:text-base font-semibold text-[#F5F5F5] hover:text-[#61F1AC] transition-colors truncate" 
                                    > 
                                      {item?.title || "Untitled Media"} 
                                    </Link> 
                                    <span className="text-xs text-[#7A7A7A] shrink-0 font-light"> 
                                      {item?.type || ""} 
                                    </span> 
                                  </div> 
                                  {rev.score && ( 
                                    <div className="flex items-center gap-1 text-[#61F1AC] font-semibold text-xs shrink-0"> 
                                      <Star size={12} className="fill-[#61F1AC] text-[#61F1AC]" /> 
                                      <span>{Number(rev.score).toFixed(1)}</span> 
                                    </div> 
                                  )} 
                                </div> 
                                <div className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed line-clamp-3 break-words"> 
                                  <FormattedText content={rev.content} isExcerpt={true} /> 
                                </div> 
                              </div> 
                              <div className="flex items-center gap-2 text-[11px] text-[#7A7A7A] mt-3"> 
                                <span>{timeAgo(rev.created_at)}</span> 
                                <span>·</span> 
                                <span> 
                                  {rev.likes || 0} {rev.likes === 1 ? "like" : "likes"} 
                                </span> 
                              </div> 
                            </div> 
                          </div> 
                        ); 
                      })} 
                    </div> 
                  )} 
                </div> 
              )} 

              {/* WATCHLIST TAB */} 
              {activeTab === "watchlist" && ( 
                <div> 
                  <div className="flex items-center justify-between mb-4"> 
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7A7A]"> 
                      Planned Titles ({watchlistItems.length}) 
                    </h3> 
                  </div> 
                  {watchlistItems.length === 0 ? ( 
                    <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-12 text-center"> 
                      <Bookmark size={32} className="mx-auto mb-3 text-[#333333]" /> 
                      <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1"> 
                        Your Watchlist is Empty 
                      </h4> 
                      <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mb-5"> 
                        Save movies, series, or books to your plan list to see them here. 
                      </p> 
                      <Link 
                        to="/movies" 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#141414] border border-[#222222] text-[#F5F5F5] hover:border-[#61F1AC]/50 transition-colors cursor-pointer" 
                      > 
                        <Film size={13} className="text-[#61F1AC]" /> 
                        <span>Explore Titles</span> 
                      </Link> 
                    </div> 
                  ) : ( 
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"> 
                      {watchlistItems.map((item) => ( 
                        <div key={item.id} className="group flex flex-col"> 
                          <Link 
                            to={getItemLink(item)} 
                            className="block aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#121212] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.15)] transition-all duration-300 relative" 
                          > 
                            <img 
                              src={ 
                                item.coverUrl || 
                                "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover" 
                              } 
                              alt={item.title} 
                              loading="lazy" 
                              referrerPolicy="no-referrer" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            /> 
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-[#F5F5F5]"> 
                              {item.type || "MEDIA"} 
                            </div> 
                          </Link> 
                          <div className="mt-2"> 
                            <Link to={getItemLink(item)} className="block"> 
                              <h4 className="text-xs sm:text-sm font-medium text-[#F5F5F5] truncate group-hover:text-[#61F1AC] transition-colors"> 
                                {item.title} 
                              </h4> 
                            </Link> 
                          </div> 
                        </div> 
                      ))} 
                    </div> 
                  )} 
                </div> 
              )} 

              {/* BOOKS TAB */} 
              {activeTab === "books" && ( 
                <div> 
                  <div className="flex items-center justify-between mb-4"> 
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7A7A]"> 
                      Books &amp; Manga ({bookItems.length}) 
                    </h3> 
                  </div> 
                  {bookItems.length === 0 ? ( 
                    <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-12 text-center"> 
                      <BookOpen size={32} className="mx-auto mb-3 text-[#333333]" /> 
                      <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1"> 
                        No Books or Manga in Collection 
                      </h4> 
                      <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mb-5"> 
                        Browse our novels, manhwa, and manga library and add books to your collection. 
                      </p> 
                      <Link 
                        to="/books/manhwa" 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#141414] border border-[#222222] text-[#F5F5F5] hover:border-[#61F1AC]/50 transition-colors cursor-pointer" 
                      > 
                        <BookOpen size={13} className="text-[#61F1AC]" /> 
                        <span>Browse Books</span> 
                      </Link> 
                    </div> 
                  ) : ( 
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"> 
                      {bookItems.map((item) => ( 
                        <div key={item.id} className="group flex flex-col"> 
                          <Link 
                            to={getItemLink(item)} 
                            className="block aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#121212] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.15)] transition-all duration-300 relative" 
                          > 
                            <img 
                              src={ 
                                item.coverUrl || 
                                "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover" 
                              } 
                              alt={item.title} 
                              loading="lazy" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            /> 
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-[#F5F5F5]"> 
                              {item.type || "BOOK"} 
                            </div> 
                          </Link> 
                          <div className="mt-2"> 
                            <Link to={getItemLink(item)} className="block"> 
                              <h4 className="text-xs sm:text-sm font-medium text-[#F5F5F5] truncate group-hover:text-[#61F1AC] transition-colors"> 
                                {item.title} 
                              </h4> 
                            </Link> 
                            <span className="text-[11px] text-[#7A7A7A] capitalize"> 
                              {item.status || "In Library"} 
                            </span> 
                          </div> 
                        </div> 
                      ))} 
                    </div> 
                  )} 
                </div> 
              )} 

              {/* ACTIVITY TAB */} 
              {activeTab === "activity" && ( 
                <div> 
                  <div className="flex items-center justify-between mb-4"> 
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7A7A]"> 
                      Recent Activity 
                    </h3> 
                  </div> 
                  {reviews.length === 0 && likes.length === 0 && collections.length === 0 ? ( 
                    <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-12 text-center"> 
                      <Activity size={32} className="mx-auto mb-3 text-[#333333]" /> 
                      <h4 className="text-sm font-semibold text-[#F5F5F5] mb-1"> 
                        No Recent Activity 
                      </h4> 
                      <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mb-5"> 
                        Your review posts, collection updates, and liked critiques will appear here. 
                      </p> 
                    </div> 
                  ) : ( 
                    <div className="space-y-3"> 
                      {/* Reviews logged */} 
                      {reviews.slice(0, 5).map((rev) => ( 
                        <div 
                          key={`act-rev-${rev.id}`} 
                          className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-4 flex items-center justify-between gap-4" 
                        > 
                          <div className="flex items-center gap-3 min-w-0"> 
                            <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-[#61F1AC] shrink-0"> 
                              <Star size={14} className="fill-[#61F1AC]" /> 
                            </div> 
                            <div className="min-w-0"> 
                              <p className="text-xs text-[#E0E0E0] truncate"> 
                                Reviewed <span className="font-semibold text-white">{rev.items?.title || "a title"}</span> with a score of <span className="text-[#61F1AC] font-semibold">{rev.score}/10</span> 
                              </p> 
                              <span className="text-[10px] text-[#7A7A7A]"> 
                                {timeAgo(rev.created_at)} 
                              </span> 
                            </div> 
                          </div> 
                          <Link 
                            to={getItemLink(rev.items)} 
                            className="p-1 text-[#7A7A7A] hover:text-[#F5F5F5] transition-colors shrink-0" 
                          > 
                            <ExternalLink size={14} /> 
                          </Link> 
                        </div> 
                      ))} 

                      {/* Collections updated */} 
                      {collections.slice(0, 5).map((col) => ( 
                        <div 
                          key={`act-col-${col.id}`} 
                          className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-4 flex items-center justify-between gap-4" 
                        > 
                          <div className="flex items-center gap-3 min-w-0"> 
                            <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-[#60A5FA] shrink-0"> 
                              <Bookmark size={14} /> 
                            </div> 
                            <div className="min-w-0"> 
                              <p className="text-xs text-[#E0E0E0] truncate"> 
                                Added <span className="font-semibold text-white">{col.title}</span> to <span className="capitalize text-[#60A5FA]">{col.status}</span> 
                              </p> 
                              <span className="text-[10px] text-[#7A7A7A]"> 
                                {timeAgo(col.createdAt)} 
                              </span> 
                            </div> 
                          </div> 
                          <Link 
                            to={getItemLink(col)} 
                            className="p-1 text-[#7A7A7A] hover:text-[#F5F5F5] transition-colors shrink-0" 
                          > 
                            <ExternalLink size={14} /> 
                          </Link> 
                        </div> 
                      ))} 
                    </div> 
                  )} 
                </div> 
              )} 
            </> 
          )} 
        </div> 

        {/* Guest helper banner */} 
        {!user && ( 
          <div className="mt-12 bg-[#0E0E0E] border border-[#1C1C1C] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"> 
            <div> 
              <h4 className="text-sm font-semibold text-[#F5F5F5]"> 
                Sign in to track your personal collection 
              </h4> 
              <p className="text-xs text-[#7A7A7A] mt-0.5"> 
                Rate titles, compile your favorites list, write critiques, and maintain your streak. 
              </p> 
            </div> 
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#61F1AC] text-black hover:bg-[#4ee89f] rounded-xl transition-all cursor-pointer shadow-md shrink-0" 
            > 
              <LogIn size={14} /> 
              <span>Sign In to Orgi</span> 
            </Link> 
          </div> 
        )} 

        {/* Edit Modal */} 
        {isEditing && ( 
          <EditProfileModal 
            profile={displayProfile} 
            onClose={() => setIsEditing(false)} 
            onSave={handleSave} 
          /> 
        )} 
      </div> 
    </div> 
  ); 
} 
