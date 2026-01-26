"use client";

import { useState } from "react";
import { Review } from "@/types/reputation";
import { useReputationActions, useSavedReplies } from "@/stores/reputation-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Star,
    Reply,
    MoreHorizontal,
    CheckCircle2,
    Send,
    History,
    X,
    Sparkles,
    ExternalLink,
    AlertCircle,
    CheckCircle,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ReviewCardProps {
    review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const { replyToReview, generateAiReply } = useReputationActions();
    const savedReplies = useSavedReplies();

    const sentimentConfig = {
        positive: { color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400", label: "Positive", icon: CheckCircle },
        neutral: { color: "text-zinc-600 bg-zinc-50 dark:bg-zinc-500/10 dark:text-zinc-400", label: "Neutral", icon: AlertCircle },
        negative: { color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400", label: "Negative", icon: AlertCircle },
    };

    const config = sentimentConfig[review.sentiment] || sentimentConfig.neutral;

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            await replyToReview(review.id, replyText);
            setReplyText("");
            setIsReplying(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateAi = async () => {
        setIsGeneratingAi(true);
        if (!isReplying) setIsReplying(true);
        try {
            const aiReply = await generateAiReply(review.text);
            setReplyText(aiReply);
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const selectTemplate = (text: string) => {
        setReplyText(text);
        setShowTemplates(false);
        if (!isReplying) setIsReplying(true);
    };

    return (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-6">
                <div className="flex items-start gap-5">
                    {/* Source Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xl text-zinc-600 dark:text-zinc-400 overflow-hidden ring-2 ring-zinc-50 dark:ring-zinc-800 pointer-events-none">
                            {review.authorPhotoUrl ? (
                                <img src={review.authorPhotoUrl} alt={review.authorName} className="w-full h-full object-cover" />
                            ) : (
                                review.authorName.charAt(0)
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-zinc-950 border-2 border-white dark:border-zinc-950 flex items-center justify-center shadow-sm">
                            {review.source === 'google' ? (
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 fill-blue-600" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-foreground text-base tracking-tight truncate">{review.authorName}</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-muted-foreground bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full lowercase shrink-0">
                                    {review.relativeTimeDescription}
                                </span>
                                {review.platformUrl && (
                                    <a
                                        href={review.platformUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-zinc-400 hover:text-indigo-500 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-200 dark:text-zinc-800"}`}
                                    />
                                ))}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1",
                                config.color
                            )}>
                                <config.icon className="w-3 h-3" />
                                {config.label}
                            </span>
                        </div>

                        <p className="text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                            {review.text}
                        </p>

                        {/* Reply Section */}
                        {review.reply ? (
                            <div className="mt-4 p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-500/[0.03] border border-indigo-100/50 dark:border-indigo-500/10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                                        <History className="w-3.5 h-3.5" />
                                        Official Response
                                    </div>
                                    <span className="text-[11px] text-zinc-400 font-medium">
                                        {format(review.reply.time, 'MMM d, yyyy')}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-700 dark:text-zinc-400 leading-relaxed italic">
                                    &ldquo;{review.reply.text}&rdquo;
                                </p>
                            </div>
                        ) : (
                            !isReplying ? (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wider"
                                        onClick={() => setIsReplying(true)}
                                    >
                                        <Reply className="w-3.5 h-3.5 mr-2" />
                                        Reply
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wider"
                                        onClick={handleGenerateAi}
                                    >
                                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                                        AI Reply
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-zinc-500 hover:text-zinc-700 h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wider"
                                        onClick={() => setShowTemplates(!showTemplates)}
                                    >
                                        <BookOpen className="w-3.5 h-3.5 mr-2" />
                                        Templates
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="relative group/reply">
                                        <Textarea
                                            placeholder="Write a thoughtful response..."
                                            className="min-h-[120px] bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-white/[0.08] resize-none focus-visible:ring-indigo-500 rounded-2xl p-4 text-sm"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-full text-zinc-400 hover:text-indigo-500"
                                                onClick={() => setShowTemplates(!showTemplates)}
                                                title="Use template"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-full text-zinc-400 hover:text-indigo-500"
                                                onClick={handleGenerateAi}
                                                disabled={isGeneratingAi}
                                                title="Re-generate with AI"
                                            >
                                                {isGeneratingAi ? (
                                                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-indigo-500 rounded-full animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-full text-zinc-400 hover:text-rose-500"
                                                onClick={() => setIsReplying(false)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs font-bold uppercase tracking-wider h-9"
                                            onClick={() => {
                                                setIsReplying(false);
                                                setReplyText("");
                                            }}
                                        >
                                            Discard
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-9 px-5 rounded-xl shadow-lg shadow-indigo-500/20 text-xs font-bold uppercase tracking-wider"
                                            onClick={handleReply}
                                            disabled={isSubmitting || !replyText.trim()}
                                        >
                                            {isSubmitting ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Send className="w-3.5 h-3.5" />
                                            )}
                                            Post Reply
                                        </Button>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Templates List */}
                        {showTemplates && (
                            <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/[0.08] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Template</span>
                                    <button onClick={() => setShowTemplates(false)}>
                                        <X className="w-3 h-3 text-zinc-400 hover:text-zinc-600" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {savedReplies.map((tmpl, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => selectTemplate(tmpl)}
                                            className="w-full text-left p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/[0.05] text-xs text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-500 transition-all font-medium"
                                        >
                                            {tmpl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Button variant="ghost" size="icon" className="text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
