import React, { useState, useEffect, useCallback } from "react"; 
import { Link } from "react-router-dom"; 
import { 
  Star, 
  ThumbsUp, 
  Flag, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  Film, 
  Tv, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  X 
} from "lucide-react"; 
import api from "../services/api"; 
import { useAuth } from "../context/AuthContext"; 
import { Button } from "../components/ui/Button"; 
import { ReviewSlider } from "../components/ui/ReviewSlider"; 

const DEFAULT_AVATAR = "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"; 

const getItemLink = (item) => { 
  if (!item) return "#"; 
  const type = (item.type || "").toLowerCase(); 
  if (type === "movie") return `/movie/${item.external_id}`; 
  if (type === "series") return `/series/${item.external_id}`; 
  if (["book", "manga", "manhwa", "manhua"].includes(type)) { 
    return `/books/${type}/${item.external_id}`; 
  } 
  return `/movie/${item.external_id}`; 
}; 

const getItemIcon = (type) => { 
  const t = (type || "").toLowerCase(); 
  if (t === "movie") return <Film size={12} className="text-[#61F1AC]" />; 
  if (t === "series") return <Tv size={12} className="text-[#60A5FA]" />; 
  return <BookOpen size={12} className="text-[#FBBF24]" />; 
}; 

const formatDate = (dateStr) => { 
  if (!dateStr) return ""; 
  try { 
    const d = new Date(dateStr); 
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric", 
    }); 
  } catch { 
    return dateStr; 
  } 
}; 

const STATUS_BADGES = { 
  pending: { 
    label: "Pending", 
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20", 
    icon: Clock, 
  }, 
  in_review: { 
    label: "In Review", 
    color: "bg-sky-500/10 text-sky-400 border-sky-500/20", 
    icon: AlertCircle, 
  }, 
  resolved: { 
    label: "Resolved", 
    color: "bg-[#61F1AC]/10 text-[#61F1AC] border-[#61F1AC]/20", 
    icon: CheckCircle2, 
  }, 
  dismissed: { 
    label: "Dismissed", 
    color: "bg-[#202020] text-[#7A7A7A] border-[#303030]", 
    icon: XCircle, 
  }, 
}; 

export function DashboardPage() { 
  const { session, user, userProfile } = useAuth(); 
  const [activeTab, setActiveTab] = useState("reviews"); 
  const [summary, setSummary] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false); 

  const [reviewsList, setReviewsList] = useState([]); 
  const [likesList, setLikesList] = useState([]); 
  const [reportsList, setReportsList] = useState([]); 
  const [modReportsList, setModReportsList] = useState([]); 
  const [modStatusFilter, setModStatusFilter] = useState("all"); 

  const [editingReview, setEditingReview] = useState(null); 
  const [editScore, setEditScore] = useState(8); 
  const [editContent, setEditContent] = useState(""); 
  const [savingEdit, setSavingEdit] = useState(false); 

  const [deletingReviewId, setDeletingReviewId] = useState(null); 
  const [deleting, setDeleting] = useState(false); 

  const [moderatingReport, setModeratingReport] = useState(null); 
  const [modStatus, setModStatus] = useState("resolved"); 
  const [modNotes, setModNotes] = useState(""); 
  const [savingMod, setSavingMod] = useState(false); 

  const loadData = useCallback(async (isSilent = false) => { 
    if (!session || !user) { 
      setLoading(false); 
      return; 
    } 
    if (!isSilent) setLoading(true); 
    else setRefreshing(true); 

    try { 
      const res = await api.get("/dashboard/summary"); 
      if (res?.success && res.data) { 
        setSummary(res.data); 
        setReviewsList(res.data.recentReviews || []); 
        setLikesList(res.data.recentLikes || []); 
        setReportsList(res.data.recentReports || []); 

        if (["admin", "moderator"].includes(res.data.userRole)) { 
          try { 
            const allRep = await api.get("/reports/all"); 
            if (allRep?.success) { 
              setModReportsList(allRep.data || []); 
            } 
          } catch {} 
        } 
      } 
    } catch { 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    } 
  }, [session, user]); 

  useEffect(() => { 
    loadData(); 
  }, [loadData]); 

  const handleOpenEdit = (review) => { 
    setEditingReview(review); 
    setEditScore(review.score || 8); 
    setEditContent(review.content || ""); 
  }; 

  const handleSaveEdit = async () => { 
    if (!editingReview || !editContent.trim()) return; 
    setSavingEdit(true); 
    try { 
      const itemId = editingReview.items?.id || editingReview.itemId; 
      const externalId = editingReview.items?.external_id; 
      const provider = editingReview.items?.provider; 
      const type = editingReview.items?.type; 
      const title = editingReview.items?.title; 
      const coverUrl = editingReview.items?.cover_url; 

      const payload = { 
        itemId, 
        externalId, 
        provider, 
        type, 
        title, 
        coverUrl, 
        score: editScore, 
        content: editContent.trim(), 
      }; 

      const res = await api.post("/reviews", payload); 
      if (res?.success) { 
        setReviewsList((prev) => 
          prev.map((r) => 
            r.id === editingReview.id 
              ? { 
                  ...r, 
                  score: editScore, 
                  content: editContent.trim(), 
                  is_edited: true, 
                  updated_at: new Date().toISOString(), 
                } 
              : r 
          ) 
        ); 
        setEditingReview(null); 
      } 
    } catch { 
    } finally { 
      setSavingEdit(false); 
    } 
  }; 

  const handleDeleteReview = async () => { 
    if (!deletingReviewId) return; 
    setDeleting(true); 
    try { 
      const res = await api.delete(`/reviews/${deletingReviewId}`); 
      if (res?.success) { 
        setReviewsList((prev) => prev.filter((r) => r.id !== deletingReviewId)); 
        setSummary((prev) => 
          prev 
            ? { 
                ...prev, 
                stats: { 
                  ...prev.stats, 
                  reviewCount: Math.max(0, (prev.stats?.reviewCount || 1) - 1), 
                }, 
              } 
            : prev 
        ); 
        setDeletingReviewId(null); 
      } 
    } catch { 
    } finally { 
      setDeleting(false); 
    } 
  }; 

  const handleUnlikeReview = async (reviewId) => { 
    try { 
      const res = await api.post(`/reviews/${reviewId}/like`); 
      if (res?.success) { 
        setLikesList((prev) => prev.filter((item) => item.review?.id !== reviewId)); 
        setSummary((prev) => 
          prev 
            ? { 
                ...prev, 
                stats: { 
                  ...prev.stats, 
                  likeCount: Math.max(0, (prev.stats?.likeCount || 1) - 1), 
                }, 
              } 
            : prev 
        ); 
      } 
    } catch {} 
  }; 

  const handleOpenModeration = (report) => { 
    setModeratingReport(report); 
    setModStatus(report.status || "resolved"); 
    setModNotes(report.moderator_notes || ""); 
  }; 

  const handleSaveModeration = async () => { 
    if (!moderatingReport) return; 
    setSavingMod(true); 
    try { 
      const res = await api.patch(`/reports/${moderatingReport.id}`, { 
        status: modStatus, 
        moderator_notes: modNotes.trim() || null, 
      }); 
      if (res?.success) { 
        setModReportsList((prev) => 
          prev.map((r) => 
            r.id === moderatingReport.id 
              ? { 
                  ...r, 
                  status: modStatus, 
                  moderator_notes: modNotes.trim() || null, 
                } 
              : r 
          ) 
        ); 
        setModeratingReport(null); 
      } 
    } catch { 
    } finally { 
      setSavingMod(false); 
    } 
  }; 

  if (!session || !user) { 
    return ( 
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16"> 
        <div className="max-w-md w-full bg-[#0D0D0D] border border-[#1C1C1C] rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden"> 
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#61F1AC]/10 blur-3xl rounded-full pointer-events-none" /> 
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-[#61F1AC]"> 
            <Sparkles size={24} /> 
          </div> 
          <h1 className="text-xl font-bold text-[#F5F5F5] mb-2 tracking-tight"> 
            Your Orgi Dashboard 
          </h1> 
          <p className="text-xs text-[#8A8A8A] leading-relaxed mb-6"> 
            Sign in to track your written reviews, manage saved critiques, and monitor community reports. 
          </p> 
          <Link to="/login"> 
            <Button variant="primary" size="md" className="w-full font-semibold"> 
              Sign In to Continue 
            </Button> 
          </Link> 
        </div> 
      </div> 
    ); 
  } 

  const isModerator = ["admin", "moderator"].includes(summary?.userRole); 
  const stats = summary?.stats || { reviewCount: 0, likeCount: 0, reportCount: 0 }; 

  const filteredModReports = modReportsList.filter((r) => { 
    if (modStatusFilter === "all") return true; 
    return r.status === modStatusFilter; 
  }); 

  return ( 
    <div className="min-h-screen pb-24 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"> 
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#0D0D0D] border border-[#1C1C1C] rounded-2xl p-6 relative overflow-hidden"> 
        <div className="flex items-center gap-4"> 
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#61F1AC]/40 bg-[#141414] flex-shrink-0 shadow-lg"> 
            <img 
              src={userProfile?.profile_url || user?.user_metadata?.avatar_url || DEFAULT_AVATAR} 
              alt="Profile" 
              onError={(e) => { 
                if (e.currentTarget.src !== DEFAULT_AVATAR) { 
                  e.currentTarget.src = DEFAULT_AVATAR; 
                } 
              }} 
              className="w-full h-full object-cover" 
            /> 
          </div> 
          <div> 
            <div className="flex items-center gap-2.5"> 
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] tracking-tight"> 
                {userProfile?.user_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Orgi Explorer"} 
              </h1> 
              {isModerator && ( 
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#61F1AC]/10 text-[#61F1AC] border border-[#61F1AC]/20"> 
                  {summary?.userRole} 
                </span> 
              )} 
            </div> 
            <p className="text-xs text-[#7A7A7A] mt-0.5 font-mono"> 
              {user.email} 
            </p> 
          </div> 
        </div> 

        <div className="flex items-center gap-2"> 
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadData(true)} 
            disabled={refreshing} 
            className="text-xs gap-1.5 cursor-pointer" 
          > 
            <RefreshCw size={13} className={refreshing ? "animate-spin text-[#61F1AC]" : ""} /> 
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span> 
          </Button> 
          <Link to="/profile"> 
            <Button variant="ghost" size="sm" className="text-xs cursor-pointer"> 
              Edit Profile 
            </Button> 
          </Link> 
        </div> 
      </div> 

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"> 
        <button 
          type="button" 
          onClick={() => setActiveTab("reviews")} 
          className={`text-left p-5 rounded-xl border transition-all cursor-pointer ${ 
            activeTab === "reviews" 
              ? "bg-[#121212] border-[#61F1AC]/50 shadow-lg" 
              : "bg-[#0B0B0B] border-[#1C1C1C] hover:border-[#2C2C2C]" 
          }`} 
        > 
          <div className="flex items-center justify-between mb-2"> 
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]"> 
              Reviews Written 
            </span> 
            <Star size={16} className="text-[#61F1AC]" /> 
          </div> 
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] font-tabular"> 
            {stats.reviewCount} 
          </div> 
          <p className="text-[11px] text-[#555555] mt-1"> 
            Ratings & critiques posted 
          </p> 
        </button> 

        <button 
          type="button" 
          onClick={() => setActiveTab("likes")} 
          className={`text-left p-5 rounded-xl border transition-all cursor-pointer ${ 
            activeTab === "likes" 
              ? "bg-[#121212] border-[#61F1AC]/50 shadow-lg" 
              : "bg-[#0B0B0B] border-[#1C1C1C] hover:border-[#2C2C2C]" 
          }`} 
        > 
          <div className="flex items-center justify-between mb-2"> 
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]"> 
              Liked Reviews 
            </span> 
            <ThumbsUp size={16} className="text-[#60A5FA]" /> 
          </div> 
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] font-tabular"> 
            {stats.likeCount} 
          </div> 
          <p className="text-[11px] text-[#555555] mt-1"> 
            Community critiques endorsed 
          </p> 
        </button> 

        <button 
          type="button" 
          onClick={() => setActiveTab(isModerator ? "moderation" : "reports")} 
          className={`text-left p-5 rounded-xl border transition-all cursor-pointer ${ 
            activeTab === (isModerator ? "moderation" : "reports") 
              ? "bg-[#121212] border-[#61F1AC]/50 shadow-lg" 
              : "bg-[#0B0B0B] border-[#1C1C1C] hover:border-[#2C2C2C]" 
          }`} 
        > 
          <div className="flex items-center justify-between mb-2"> 
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]"> 
              {isModerator ? "Moderation Queue" : "Reports Filed"} 
            </span> 
            {isModerator ? ( 
              <ShieldCheck size={16} className="text-[#A78BFA]" /> 
            ) : ( 
              <Flag size={16} className="text-[#FBBF24]" /> 
            )} 
          </div> 
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] font-tabular"> 
            {isModerator ? modReportsList.length : stats.reportCount} 
          </div> 
          <p className="text-[11px] text-[#555555] mt-1"> 
            {isModerator ? "Community reports to review" : "Contributions to community safety"} 
          </p> 
        </button> 
      </div> 

      <div className="flex items-center gap-2 border-b border-[#1C1C1C] mb-6 overflow-x-auto pb-1"> 
        <button 
          type="button" 
          onClick={() => setActiveTab("reviews")} 
          className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${ 
            activeTab === "reviews" 
              ? "bg-[#181818] text-[#61F1AC] border border-[#262626]" 
              : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#121212]" 
          }`} 
        > 
          <Star size={13} /> 
          <span>My Reviews</span> 
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-[#B5B5B5]"> 
            {reviewsList.length} 
          </span> 
        </button> 

        <button 
          type="button" 
          onClick={() => setActiveTab("likes")} 
          className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${ 
            activeTab === "likes" 
              ? "bg-[#181818] text-[#61F1AC] border border-[#262626]" 
              : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#121212]" 
          }`} 
        > 
          <ThumbsUp size={13} /> 
          <span>My Likes</span> 
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-[#B5B5B5]"> 
            {likesList.length} 
          </span> 
        </button> 

        <button 
          type="button" 
          onClick={() => setActiveTab("reports")} 
          className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${ 
            activeTab === "reports" 
              ? "bg-[#181818] text-[#61F1AC] border border-[#262626]" 
              : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#121212]" 
          }`} 
        > 
          <Flag size={13} /> 
          <span>My Reports</span> 
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-[#B5B5B5]"> 
            {reportsList.length} 
          </span> 
        </button> 

        {isModerator && ( 
          <button 
            type="button" 
            onClick={() => setActiveTab("moderation")} 
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${ 
              activeTab === "moderation" 
                ? "bg-[#181818] text-[#61F1AC] border border-[#262626]" 
                : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#121212]" 
            }`} 
          > 
            <ShieldCheck size={13} /> 
            <span>Moderation Queue</span> 
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-[#B5B5B5]"> 
              {modReportsList.length} 
            </span> 
          </button> 
        )} 
      </div> 

      {loading ? ( 
        <div className="flex flex-col items-center justify-center py-20 text-[#666666]"> 
          <RefreshCw size={24} className="animate-spin mb-3 text-[#61F1AC]" /> 
          <p className="text-xs">Loading dashboard data...</p> 
        </div> 
      ) : ( 
        <> 
          {activeTab === "reviews" && ( 
            <div className="space-y-4"> 
              {reviewsList.length === 0 ? ( 
                <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-12 text-center"> 
                  <Star size={32} className="mx-auto mb-3 text-[#333333]" /> 
                  <h3 className="text-sm font-bold text-[#F5F5F5] mb-1"> 
                    No Reviews Written Yet 
                  </h3> 
                  <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mb-5"> 
                    Explore movies, series, or books across Orgi and share your critical thoughts with the community. 
                  </p> 
                  <Link to="/movies"> 
                    <Button variant="primary" size="sm" className="font-semibold"> 
                      Browse Catalog 
                    </Button> 
                  </Link> 
                </div> 
              ) : ( 
                <div className="grid grid-cols-1 gap-4"> 
                  {reviewsList.map((review) => { 
                    const item = review.items; 
                    return ( 
                      <article 
                        key={review.id} 
                        className="bg-[#0D0D0D] border border-[#1C1C1C] hover:border-[#282828] rounded-xl p-5 transition-all flex flex-col sm:flex-row gap-5" 
                      > 
                        <div className="w-full sm:w-28 h-36 sm:h-auto rounded-lg overflow-hidden bg-[#141414] border border-[#202020] flex-shrink-0 relative group"> 
                          {item?.cover_url ? ( 
                            <img 
                              src={item.cover_url} 
                              alt={item?.title || "Cover"} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            /> 
                          ) : ( 
                            <div className="w-full h-full flex items-center justify-center text-[#444444]"> 
                              <Film size={24} /> 
                            </div> 
                          )} 
                          {item?.type && ( 
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-1"> 
                              {getItemIcon(item.type)} 
                              <span>{item.type}</span> 
                            </div> 
                          )} 
                        </div> 

                        <div className="flex-1 flex flex-col justify-between min-w-0"> 
                          <div> 
                            <div className="flex items-start justify-between gap-3 mb-2"> 
                              <div> 
                                <Link 
                                  to={getItemLink(item)} 
                                  className="text-base font-bold text-[#F5F5F5] hover:text-[#61F1AC] transition-colors inline-flex items-center gap-1.5" 
                                > 
                                  <span className="truncate">{item?.title || "Untitled Media"}</span> 
                                  <ExternalLink size={12} className="opacity-50" /> 
                                </Link> 
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#7A7A7A]"> 
                                  <span>{formatDate(review.created_at)}</span> 
                                  {review.is_edited && ( 
                                    <span className="text-[10px] text-[#61F1AC]/80 font-medium"> 
                                      (edited) 
                                    </span> 
                                  )} 
                                </div> 
                              </div> 

                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#141414] border border-[#222222] flex-shrink-0"> 
                                <Star size={12} className="fill-[#61F1AC] text-[#61F1AC]" /> 
                                <span className="font-bold text-[#61F1AC] text-xs font-tabular"> 
                                  {review.score} / 10 
                                </span> 
                              </div> 
                            </div> 

                            <p className="text-xs text-[#CCCCCC] leading-relaxed whitespace-pre-line"> 
                              {review.content} 
                            </p> 
                          </div> 

                          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#1C1C1C]"> 
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenEdit(review)} 
                              className="text-xs gap-1.5 py-1 px-3 cursor-pointer" 
                            > 
                              <Edit3 size={12} /> 
                              <span>Edit</span> 
                            </Button> 
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setDeletingReviewId(review.id)} 
                              className="text-xs gap-1.5 py-1 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer" 
                            > 
                              <Trash2 size={12} /> 
                              <span>Delete</span> 
                            </Button> 
                          </div> 
                        </div> 
                      </article> 
                    ); 
                  })} 
                </div> 
              )} 
            </div> 
          )} 

          {activeTab === "likes" && ( 
            <div className="space-y-4"> 
              {likesList.length === 0 ? ( 
                <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-12 text-center"> 
                  <ThumbsUp size={32} className="mx-auto mb-3 text-[#333333]" /> 
                  <h3 className="text-sm font-bold text-[#F5F5F5] mb-1"> 
                    No Liked Reviews Yet 
                  </h3> 
                  <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto mb-5"> 
                    When you find insightful reviews from fellow members, give them a thumbs up to save them here. 
                  </p> 
                  <Link to="/feed"> 
                    <Button variant="primary" size="sm" className="font-semibold"> 
                      Explore Reviews Feed 
                    </Button> 
                  </Link> 
                </div> 
              ) : ( 
                <div className="grid grid-cols-1 gap-4"> 
                  {likesList.map((item) => { 
                    const rev = item.review; 
                    if (!rev) return null; 
                    const media = rev.items; 
                    const author = rev.users; 

                    return ( 
                      <article 
                        key={item.likeId || rev.id} 
                        className="bg-[#0D0D0D] border border-[#1C1C1C] hover:border-[#282828] rounded-xl p-5 transition-all flex flex-col sm:flex-row gap-5" 
                      > 
                        <div className="w-full sm:w-24 h-32 sm:h-auto rounded-lg overflow-hidden bg-[#141414] border border-[#202020] flex-shrink-0"> 
                          {media?.cover_url ? ( 
                            <img 
                              src={media.cover_url} 
                              alt={media?.title || "Media"} 
                              className="w-full h-full object-cover" 
                            /> 
                          ) : ( 
                            <div className="w-full h-full flex items-center justify-center text-[#444444]"> 
                              <Film size={20} /> 
                            </div> 
                          )} 
                        </div> 

                        <div className="flex-1 flex flex-col justify-between min-w-0"> 
                          <div> 
                            <div className="flex items-start justify-between gap-3 mb-2"> 
                              <div> 
                                <Link 
                                  to={getItemLink(media)} 
                                  className="text-sm font-bold text-[#F5F5F5] hover:text-[#61F1AC] transition-colors inline-flex items-center gap-1.5" 
                                > 
                                  <span className="truncate">{media?.title || "Untitled Media"}</span> 
                                  <ExternalLink size={11} className="opacity-50" /> 
                                </Link> 

                                <div className="flex items-center gap-2 mt-1.5"> 
                                  <img 
                                    src={author?.profile_url || DEFAULT_AVATAR} 
                                    alt={author?.user_name || "Author"} 
                                    onError={(e) => { 
                                      if (e.currentTarget.src !== DEFAULT_AVATAR) { 
                                        e.currentTarget.src = DEFAULT_AVATAR; 
                                      } 
                                    }} 
                                    className="w-5 h-5 rounded-full object-cover bg-[#222222]" 
                                  /> 
                                  <span className="text-xs font-semibold text-[#E0E0E0]"> 
                                    {author?.user_name || "Anonymous Member"} 
                                  </span> 
                                  <span className="text-[#555555]">·</span> 
                                  <span className="text-[11px] text-[#7A7A7A]"> 
                                    {formatDate(rev.created_at)} 
                                  </span> 
                                </div> 
                              </div> 

                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#141414] border border-[#222222] flex-shrink-0"> 
                                <Star size={11} className="fill-[#61F1AC] text-[#61F1AC]" /> 
                                <span className="font-bold text-[#61F1AC] text-xs font-tabular"> 
                                  {rev.score} / 10 
                                </span> 
                              </div> 
                            </div> 

                            <p className="text-xs text-[#CCCCCC] leading-relaxed line-clamp-3"> 
                              {rev.content} 
                            </p> 
                          </div> 

                          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#1C1C1C]"> 
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUnlikeReview(rev.id)} 
                              className="text-xs gap-1.5 py-1 px-3 text-[#61F1AC] border-[#61F1AC]/30 hover:border-[#61F1AC] cursor-pointer" 
                            > 
                              <ThumbsUp size={12} className="fill-[#61F1AC]" /> 
                              <span>Liked</span> 
                            </Button> 
                          </div> 
                        </div> 
                      </article> 
                    ); 
                  })} 
                </div> 
              )} 
            </div> 
          )} 

          {activeTab === "reports" && ( 
            <div className="space-y-4"> 
              {reportsList.length === 0 ? ( 
                <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-12 text-center"> 
                  <Flag size={32} className="mx-auto mb-3 text-[#333333]" /> 
                  <h3 className="text-sm font-bold text-[#F5F5F5] mb-1"> 
                    No Reports Filed 
                  </h3> 
                  <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto"> 
                    Thank you for keeping our community respectful and engaging. If you ever encounter violations or spam, use the report button to flag them. 
                  </p> 
                </div> 
              ) : ( 
                <div className="grid grid-cols-1 gap-3"> 
                  {reportsList.map((report) => { 
                    const badge = STATUS_BADGES[report.status] || STATUS_BADGES.pending; 
                    const StatusIcon = badge.icon; 

                    return ( 
                      <article 
                        key={report.id} 
                        className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-xl p-5 flex flex-col gap-3" 
                      > 
                        <div className="flex items-start justify-between gap-3"> 
                          <div> 
                            <div className="flex items-center gap-2"> 
                              <span className="text-xs font-bold text-[#F5F5F5] capitalize"> 
                                Reported {report.target_type} 
                              </span> 
                              <span className="text-[10px] text-[#666666] font-mono"> 
                                #{report.target_id?.slice(0, 8)} 
                              </span> 
                            </div> 
                            <span className="text-[11px] text-[#7A7A7A]"> 
                              Submitted {formatDate(report.created_at)} 
                            </span> 
                          </div> 

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${badge.color}`}> 
                            <StatusIcon size={11} /> 
                            <span>{badge.label}</span> 
                          </span> 
                        </div> 

                        <div className="bg-[#121212] border border-[#1E1E1E] rounded-lg p-3"> 
                          <span className="text-[10px] uppercase font-bold text-[#666666] block mb-1"> 
                            Reason 
                          </span> 
                          <p className="text-xs text-[#D5D5D5] leading-relaxed"> 
                            {report.reason} 
                          </p> 
                        </div> 

                        {report.moderator_notes && ( 
                          <div className="bg-[#101915] border border-[#1E3A2B] rounded-lg p-3"> 
                            <span className="text-[10px] uppercase font-bold text-[#61F1AC] block mb-1"> 
                              Moderator Response 
                            </span> 
                            <p className="text-xs text-[#BFE8D6] leading-relaxed"> 
                              {report.moderator_notes} 
                            </p> 
                          </div> 
                        )} 
                      </article> 
                    ); 
                  })} 
                </div> 
              )} 
            </div> 
          )} 

          {activeTab === "moderation" && isModerator && ( 
            <div className="space-y-4"> 
              <div className="flex items-center gap-2 overflow-x-auto pb-1"> 
                {["all", "pending", "in_review", "resolved", "dismissed"].map((st) => ( 
                  <button 
                    key={st} 
                    type="button" 
                    onClick={() => setModStatusFilter(st)} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${ 
                      modStatusFilter === st 
                        ? "bg-[#61F1AC] text-black font-bold" 
                        : "bg-[#141414] text-[#7A7A7A] hover:text-[#F5F5F5] border border-[#1C1C1C]" 
                    }`} 
                  > 
                    {st.replace("_", " ")} 
                  </button> 
                ))} 
              </div> 

              {filteredModReports.length === 0 ? ( 
                <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-12 text-center"> 
                  <ShieldCheck size={32} className="mx-auto mb-3 text-[#333333]" /> 
                  <h3 className="text-sm font-bold text-[#F5F5F5] mb-1"> 
                    No Reports in this Queue 
                  </h3> 
                  <p className="text-xs text-[#7A7A7A]"> 
                    Everything is clean and peaceful. 
                  </p> 
                </div> 
              ) : ( 
                <div className="grid grid-cols-1 gap-3"> 
                  {filteredModReports.map((report) => { 
                    const badge = STATUS_BADGES[report.status] || STATUS_BADGES.pending; 
                    const StatusIcon = badge.icon; 
                    const reporter = report.users; 

                    return ( 
                      <article 
                        key={report.id} 
                        className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-xl p-5 flex flex-col gap-3" 
                      > 
                        <div className="flex items-start justify-between gap-3"> 
                          <div> 
                            <div className="flex items-center gap-2"> 
                              <span className="text-xs font-bold text-[#F5F5F5] capitalize"> 
                                Flagged {report.target_type} 
                              </span> 
                              <span className="text-[10px] text-[#666666] font-mono"> 
                                #{report.target_id?.slice(0, 8)} 
                              </span> 
                            </div> 
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#7A7A7A]"> 
                              <span>Reporter: {reporter?.user_name || report.reporter_id?.slice(0, 8) || "Unknown"}</span> 
                              <span>·</span> 
                              <span>{formatDate(report.created_at)}</span> 
                            </div> 
                          </div> 

                          <div className="flex items-center gap-2"> 
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${badge.color}`}> 
                              <StatusIcon size={11} /> 
                              <span>{badge.label}</span> 
                            </span> 
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenModeration(report)} 
                              className="text-xs py-1 px-3 cursor-pointer" 
                            > 
                              <span>Moderate</span> 
                            </Button> 
                          </div> 
                        </div> 

                        <div className="bg-[#121212] border border-[#1E1E1E] rounded-lg p-3"> 
                          <span className="text-[10px] uppercase font-bold text-[#666666] block mb-1"> 
                            Report Reason 
                          </span> 
                          <p className="text-xs text-[#D5D5D5] leading-relaxed"> 
                            {report.reason} 
                          </p> 
                        </div> 

                        {report.moderator_notes && ( 
                          <div className="bg-[#101915] border border-[#1E3A2B] rounded-lg p-3"> 
                            <span className="text-[10px] uppercase font-bold text-[#61F1AC] block mb-1"> 
                              Existing Notes 
                            </span> 
                            <p className="text-xs text-[#BFE8D6] leading-relaxed"> 
                              {report.moderator_notes} 
                            </p> 
                          </div> 
                        )} 
                      </article> 
                    ); 
                  })} 
                </div> 
              )} 
            </div> 
          )} 
        </> 
      )} 

      {editingReview && ( 
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
          <div className="w-full max-w-lg bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-6 text-[#F5F5F5]"> 
            <div className="flex items-center justify-between mb-4"> 
              <div> 
                <h2 className="text-base font-bold text-[#F5F5F5]">Edit Review</h2> 
                <p className="text-xs text-[#7A7A7A] mt-0.5"> 
                  {editingReview.items?.title || "Review"} 
                </p> 
              </div> 
              <button 
                type="button" 
                onClick={() => setEditingReview(null)} 
                className="text-[#7A7A7A] hover:text-white cursor-pointer" 
              > 
                <X size={16} /> 
              </button> 
            </div> 

            <div className="mb-5"> 
              <ReviewSlider 
                value={editScore} 
                onChange={setEditScore} 
                disabled={savingEdit} 
              /> 
            </div> 

            <div className="mb-5"> 
              <label className="block text-xs font-medium text-[#7A7A7A] mb-1.5 uppercase tracking-wide"> 
                Review Content 
              </label> 
              <textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
                rows={5} 
                disabled={savingEdit} 
                className="w-full bg-[#141414] border border-[#222222] focus:border-[#61F1AC]/60 rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#555555] outline-none resize-none leading-relaxed" 
                placeholder="Share your detailed analysis..." 
              /> 
            </div> 

            <div className="flex justify-end gap-2.5"> 
              <Button 
                variant="outline" 
                size="sm" 
                disabled={savingEdit} 
                onClick={() => setEditingReview(null)} 
                className="text-xs px-4 cursor-pointer" 
              > 
                <span>Cancel</span> 
              </Button> 
              <Button 
                variant="primary" 
                size="sm" 
                disabled={savingEdit || !editContent.trim()} 
                onClick={handleSaveEdit} 
                className="text-xs font-semibold px-4 cursor-pointer" 
              > 
                <span>{savingEdit ? "Saving..." : "Save Changes"}</span> 
              </Button> 
            </div> 
          </div> 
        </div> 
      )} 

      {deletingReviewId && ( 
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
          <div className="w-full max-w-sm bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-6 text-[#F5F5F5] text-center"> 
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3"> 
              <Trash2 size={20} /> 
            </div> 
            <h2 className="text-base font-bold text-[#F5F5F5] mb-2">Delete Review?</h2> 
            <p className="text-xs text-[#7A7A7A] leading-relaxed mb-6"> 
              Are you sure you want to delete this review? This action cannot be undone. 
            </p> 
            <div className="flex justify-center gap-2.5"> 
              <Button 
                variant="outline" 
                size="sm" 
                disabled={deleting} 
                onClick={() => setDeletingReviewId(null)} 
                className="text-xs px-4 cursor-pointer" 
              > 
                <span>Cancel</span> 
              </Button> 
              <Button 
                variant="primary" 
                size="sm" 
                disabled={deleting} 
                onClick={handleDeleteReview} 
                className="text-xs font-semibold px-4 bg-red-500 hover:bg-red-600 text-white border-0 cursor-pointer" 
              > 
                <span>{deleting ? "Deleting..." : "Delete Review"}</span> 
              </Button> 
            </div> 
          </div> 
        </div> 
      )} 

      {moderatingReport && ( 
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
          <div className="w-full max-w-md bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl p-6 text-[#F5F5F5]"> 
            <div className="flex items-center justify-between mb-4"> 
              <div> 
                <h2 className="text-base font-bold text-[#F5F5F5]">Moderate Report</h2> 
                <p className="text-xs text-[#7A7A7A] mt-0.5"> 
                  Target: {moderatingReport.target_type} #{moderatingReport.target_id?.slice(0, 8)} 
                </p> 
              </div> 
              <button 
                type="button" 
                onClick={() => setModeratingReport(null)} 
                className="text-[#7A7A7A] hover:text-white cursor-pointer" 
              > 
                <X size={16} /> 
              </button> 
            </div> 

            <div className="mb-4"> 
              <label className="block text-xs font-medium text-[#7A7A7A] mb-1.5 uppercase tracking-wide"> 
                Action Status 
              </label> 
              <div className="grid grid-cols-3 gap-2"> 
                {["in_review", "resolved", "dismissed"].map((st) => ( 
                  <button 
                    key={st} 
                    type="button" 
                    onClick={() => setModStatus(st)} 
                    className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${ 
                      modStatus === st 
                        ? "bg-[#61F1AC]/15 text-[#61F1AC] border-[#61F1AC]/40" 
                        : "bg-[#141414] text-[#7A7A7A] border-[#222222] hover:text-[#F5F5F5]" 
                    }`} 
                  > 
                    {st.replace("_", " ")} 
                  </button> 
                ))} 
              </div> 
            </div> 

            <div className="mb-5"> 
              <label className="block text-xs font-medium text-[#7A7A7A] mb-1.5 uppercase tracking-wide"> 
                Moderator Notes 
              </label> 
              <textarea 
                value={modNotes} 
                onChange={(e) => setModNotes(e.target.value)} 
                rows={3} 
                disabled={savingMod} 
                className="w-full bg-[#141414] border border-[#222222] focus:border-[#61F1AC]/60 rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#555555] outline-none resize-none leading-relaxed" 
                placeholder="Explain the moderation action or findings..." 
              /> 
            </div> 

            <div className="flex justify-end gap-2.5"> 
              <Button 
                variant="outline" 
                size="sm" 
                disabled={savingMod} 
                onClick={() => setModeratingReport(null)} 
                className="text-xs px-4 cursor-pointer" 
              > 
                <span>Cancel</span> 
              </Button> 
              <Button 
                variant="primary" 
                size="sm" 
                disabled={savingMod} 
                onClick={handleSaveModeration} 
                className="text-xs font-semibold px-4 cursor-pointer" 
              > 
                <span>{savingMod ? "Updating..." : "Save Resolution"}</span> 
              </Button> 
            </div> 
          </div> 
        </div> 
      )} 
    </div> 
  ); 
} 
