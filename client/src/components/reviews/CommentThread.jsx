import React, { useEffect, useRef, useState } from "react";
import { CornerDownRight, Loader2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { LikeButton } from "./LikeButton";
import { FormattedText } from "../common/FormattedText";
import { handleFormattingKeyDown } from "../common/CommentFormattingToolbar";
import { Button } from "../ui/Button";
import { getReviewAuthor } from "../../utils/reviewUtils";
import { useAuth } from "../../context/AuthContext"; 
import { useToast } from "../../context/ToastContext"; 

const DEFAULT_AVATAR = 
    "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"; 

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getAuthor(c) {
    return getReviewAuthor(c, "Anonymous");
}

function timeAgo(value) {
    if (!value) return "";
    const t = new Date(value).getTime();
    if (Number.isNaN(t)) return "";
    const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return "now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w`;
    return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Collapse any depth of nesting into ONE flat list (TikTok / Instagram style).
 * The tree is kept intact in state; only the rendering is flattened.
 *
 * `replyTo` is only set when a reply targets another reply (depth >= 2).
 * Direct replies to the top-level comment get no tag, so there's never a
 * redundant "@name" sitting under a comment that is already obviously
 * replying to that person.
 */
function flattenReplies(replies, parentName, depth, out = []) {
    for (const r of replies || []) {
        out.push({ comment: r, replyTo: depth >= 2 ? parentName : null });
        if (r.replies?.length) flattenReplies(r.replies, getAuthor(r).name, depth + 1, out);
    }
    return out;
}

/* ------------------------------------------------------------------ */
/* Inline reply composer                                               */
/* ------------------------------------------------------------------ */

function InlineComposer({ avatar, replyingTo, submitting, onSubmit, onCancel, currentUserName = "You" }) {
    const [text, setText] = useState("");
    const [anon, setAnon] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        ref.current?.focus();
    }, []);

    const autosize = (el) => {
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };

    const send = () => {
        if (!text.trim() || submitting) return;
        onSubmit(text, anon);
    };

    return (
        <div className="flex gap-3 pt-3">
            <Avatar
                src={anon ? undefined : avatar}
                name={anon ? "Anonymous" : currentUserName}
                size="w-7 h-7"
            />
            <div className="flex-1 min-w-0">
                <textarea
                    ref={ref}
                    value={text}
                    rows={1}
                    placeholder={`Reply to ${replyingTo}`}
                    onChange={(e) => {
                        setText(e.target.value);
                        autosize(e.target);
                    }}
                    onKeyDown={(e) => {
                        handleFormattingKeyDown(e, ref.current, text, setText);
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            send();
                        }
                        if (e.key === "Escape") {
                            e.stopPropagation();
                            onCancel();
                        }
                    }}
                    className="w-full resize-none rounded-2xl bg-white/[0.06] px-3.5 py-2 text-[15px] leading-snug text-[#F5F5F5] placeholder-[#7A7A7A] outline-none transition-colors focus:bg-white/[0.09]"
                />
                <div className="mt-2 flex items-center justify-between">
                    <label className="flex cursor-pointer select-none items-center gap-1.5 text-[13px] text-[#7A7A7A] transition-colors hover:text-[#F5F5F5]">
                        <input
                            type="checkbox"
                            checked={anon}
                            onChange={(e) => setAnon(e.target.checked)}
                            className="h-3.5 w-3.5 cursor-pointer rounded accent-[#61F1AC]"
                        />
                        <span>Anonymous</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="cursor-pointer text-[13px] font-semibold text-[#7A7A7A] transition-colors hover:text-[#F5F5F5]"
                        >
                            Cancel
                        </button>
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={submitting || !text.trim()}
                            onClick={send}
                            className="cursor-pointer px-4 py-1.5 text-xs font-semibold"
                        >
                            <span>{submitting ? "Posting..." : "Reply"}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* A single comment row (used for both top-level comments and replies) */
/* ------------------------------------------------------------------ */

function CommentRow({ comment, replyTo, small = false, liked, onToggleLike, onReply, allowReply }) {
    const { name, avatar } = getAuthor(comment);
    const time = timeAgo(comment.createdAt || comment.created_at || comment.time);
    const baseLikes = comment.likes ?? comment.likesCount ?? 0; 
    const likes = Math.max(0, baseLikes + (liked && !comment.isLiked ? 1 : !liked && comment.isLiked ? -1 : 0)); 
    const content = comment.content || comment.rawContent || comment.excerpt; 

    return ( 
        <div id={comment?.id ? `review-${comment.id}` : undefined} className="flex gap-3"> 
            <Avatar src={avatar} name={name} size={small ? "w-7 h-7" : "w-9 h-9"} />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[13px] leading-none">
                    <span className="truncate font-semibold text-[#F5F5F5]">{name}</span>
                    {time && <span className="shrink-0 text-[#7A7A7A]">{time}</span>}
                </div>

                {replyTo && (
                    <div className="mt-1.5 flex items-center gap-1 text-[13px] leading-none text-[#F5F5F5]">
                        <CornerDownRight size={13} className="shrink-0 text-[#7A7A7A]" />
                        <span className="truncate font-medium">{replyTo}</span>
                    </div>
                )}

                <div className="mt-1.5 break-words text-[15px] leading-[1.5] text-[#F5F5F5]">
                    <FormattedText content={content} />
                </div>

                {allowReply && (
                    <button
                        type="button"
                        onClick={onReply}
                        className="mt-1.5 cursor-pointer text-[13px] font-semibold text-[#7A7A7A] transition-colors hover:text-[#F5F5F5]"
                    >
                        Reply
                    </button>
                )}
            </div>

            <div className="shrink-0 pt-0.5">
                <LikeButton liked={liked} count={likes} onToggle={onToggleLike} size={16} />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

/**
 * Props
 *  - comments:          top-level comments, each may carry a nested `replies` tree
 *  - currentUserAvatar: avatar shown in the inline composer
 *  - currentUserName:   name shown in the inline composer
 *  - likedReviews:      { [commentId]: boolean }
 *  - onToggleLike(comment)
 *  - onPostReply(parentId, targetAuthor, text, anonymous) => Promise<boolean>
 *  - onLoadReplies(commentId)?  optional async hook for lazy-loading replies;
 *                               the spinner shows while it runs
 *  - allowReply:        default true
 */
export function CommentThread({
    comments,
    currentUserAvatar,
    currentUserName = "You",
    likedReviews = {},
    onToggleLike,
    onPostReply,
    onLoadReplies,
    allowReply = true,
}) {
    const { user, userProfile } = useAuth(); 
    const { showToast, openAuthModal } = useToast(); 
    const effectiveAvatar = 
        currentUserAvatar || 
        userProfile?.profile_url || 
        user?.profile_url || 
        user?.user_metadata?.avatar_url || 
        user?.user_metadata?.picture || 
        DEFAULT_AVATAR; 
    const effectiveName = 
        currentUserName && currentUserName !== "You" 
            ? currentUserName 
            : (userProfile?.user_name || 
               user?.user_name || 
               user?.user_metadata?.user_name || 
               user?.user_metadata?.full_name || 
               user?.user_metadata?.name || 
               "You"); 

    const [expanded, setExpanded] = useState({});
    const [loading, setLoading] = useState({});
    const [target, setTarget] = useState(null); // { id, rootId, author }
    const [submitting, setSubmitting] = useState(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const toggleReplies = async (id) => {
        if (loading[id]) return;
        if (expanded[id]) {
            setExpanded((p) => ({ ...p, [id]: false }));
            return;
        }
        setLoading((p) => ({ ...p, [id]: true }));
        try {
            // Always show the spinner briefly so the expand never feels like a jump.
            await Promise.all([onLoadReplies ? onLoadReplies(id) : null, wait(350)]);
        } catch {
            /* fall through and expand whatever we already have */
        }
        if (!mounted.current) return;
        setLoading((p) => ({ ...p, [id]: false }));
        setExpanded((p) => ({ ...p, [id]: true }));
    };

    const openReply = (comment, rootId) => {
        const token = localStorage.getItem("orgi_session");
        if (!token) {
            showToast({ 
                message: "Please sign in to reply.", 
                actionText: "Sign In", 
                onAction: openAuthModal, 
            }); 
            return;
        }
        setTarget((current) =>
            current?.id === comment.id
                ? null
                : { id: comment.id, rootId, author: getAuthor(comment).name }
        );
    };

    const submitReply = async (text, anon) => {
        if (!target) return;
        setSubmitting(true);
        let ok = false;
        try {
            ok = await onPostReply(target.id, target.author, text, anon);
        } finally {
            if (mounted.current) setSubmitting(false);
        }
        if (ok && mounted.current) {
            setExpanded((p) => ({ ...p, [target.rootId]: true }));
            setTarget(null);
        }
    };

    const composerFor = (id) =>
        target?.id === id ? (
            <InlineComposer
                key={id}
                avatar={effectiveAvatar}
                currentUserName={effectiveName}
                replyingTo={target.author}
                submitting={submitting}
                onSubmit={submitReply}
                onCancel={() => setTarget(null)}
            />
        ) : null;

    return (
        <ul className="space-y-6">
            {comments.map((root) => {
                const rootName = getAuthor(root).name;
                const flat = flattenReplies(root.replies, rootName, 1);
                const count = Math.max(flat.length, root.repliesCount || 0);
                const isOpen = Boolean(expanded[root.id]);
                const isLoading = Boolean(loading[root.id]);

                return (
                    <li key={root.id}>
                        <CommentRow
                            comment={root}
                            liked={Boolean(likedReviews[root.id])}
                            onToggleLike={() => onToggleLike?.(root)}
                            onReply={() => openReply(root, root.id)}
                            allowReply={allowReply}
                        />

                        {/* Replies are indented ONE level, always. */}
                        <div className="ml-12">
                            {composerFor(root.id)}

                            {count > 0 && (
                                <button
                                    type="button"
                                    onClick={() => toggleReplies(root.id)}
                                    disabled={isLoading}
                                    className="mt-3 flex cursor-pointer items-center gap-3 text-[13px] font-semibold text-[#7A7A7A] transition-colors hover:text-[#F5F5F5] disabled:cursor-default"
                                >
                                    <span className="h-px w-6 bg-white/15" />
                                    {isLoading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 size={13} className="animate-spin" />
                                            Loading replies
                                        </span>
                                    ) : isOpen ? (
                                        "Hide replies"
                                    ) : (
                                        `View ${count} ${count === 1 ? "reply" : "replies"}`
                                    )}
                                </button>
                            )}

                            {isOpen && flat.length > 0 && (
                                <div className="mt-4 space-y-5 border-l-2 border-white/10 pl-4">
                                    {flat.map(({ comment, replyTo }) => (
                                        <div key={comment.id}>
                                            <CommentRow
                                                comment={comment}
                                                replyTo={replyTo}
                                                small
                                                liked={Boolean(likedReviews[comment.id])}
                                                onToggleLike={() => onToggleLike?.(comment)}
                                                onReply={() => openReply(comment, root.id)}
                                                allowReply={allowReply}
                                            />
                                            {/* Reply-to-a-reply composer sits right under that reply. */}
                                            {composerFor(comment.id) && (
                                                <div className="mt-2">{composerFor(comment.id)}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}