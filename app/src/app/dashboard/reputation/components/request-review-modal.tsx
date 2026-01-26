"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Send,
    Mail,
    MessageSquare,
    Copy,
    Check,
    Star
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RequestReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RequestReviewModal({ isOpen, onClose }: RequestReviewModalProps) {
    const [step, setStep] = useState<'rating' | 'sharing' | 'feedback'>('rating');
    const [rating, setRating] = useState(0);
    const [method, setMethod] = useState<'email' | 'sms'>('email');
    const [recipient, setRecipient] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const [internalFeedback, setInternalFeedback] = useState("");

    const reviewLink = "https://g.page/r/your-business-id/review";

    const handleRating = (r: number) => {
        setRating(r);
        if (r >= 4) {
            setStep('sharing');
        } else {
            setStep('feedback');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(reviewLink);
        setHasCopied(true);
        toast.success("Review link copied to clipboard");
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleSend = async () => {
        if (!recipient) return;
        setIsSending(true);
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSending(false);
        toast.success(`Request sent to ${recipient}`);
        resetAndClose();
    };

    const handleFeedbackSubmit = async () => {
        setIsSending(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        setIsSending(false);
        toast.success("Thank you for your honest feedback. We'll reach out soon.");
        resetAndClose();
    };

    const resetAndClose = () => {
        onClose();
        setTimeout(() => {
            setStep('rating');
            setRating(0);
            setRecipient("");
            setInternalFeedback("");
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-[480px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.08] p-0 overflow-hidden rounded-3xl">
                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            {step === 'rating' && "How are we doing?"}
                            {step === 'sharing' && "Spread the word!"}
                            {step === 'feedback' && "Let us make it right"}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                            {step === 'rating' && "Select a rating to continue."}
                            {step === 'sharing' && "We're thrilled you had a great experience! Share it with the world."}
                            {step === 'feedback' && "Oh no! We're sorry to hear that. Tell us what went wrong so we can help."}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'rating' && (
                        <div className="flex justify-center gap-3 py-4">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => handleRating(r)}
                                    className="group relative flex flex-col items-center gap-2"
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                        "bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.05]",
                                        "hover:bg-indigo-500 hover:border-indigo-500 hover:scale-110"
                                    )}>
                                        <Star className={cn(
                                            "w-7 h-7 transition-colors duration-300",
                                            "text-zinc-300 group-hover:text-white fill-none group-hover:fill-white"
                                        )} />
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 group-hover:text-indigo-500 uppercase tracking-widest">{r}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'sharing' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex p-1 bg-zinc-100 dark:bg-white/[0.05] rounded-2xl">
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${method === 'email' ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}
                                    onClick={() => setMethod('email')}
                                >
                                    <Mail className="w-4 h-4" />
                                    Email
                                </button>
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${method === 'sms' ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}
                                    onClick={() => setMethod('sms')}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    SMS
                                </button>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    placeholder={method === 'email' ? 'customer@example.com' : 'Phone number'}
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.08] h-12 rounded-xl text-sm"
                                />
                                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[13px] text-zinc-500 leading-relaxed italic relative">
                                    <div className="absolute -top-2 left-4 px-2 bg-white dark:bg-zinc-900 text-[10px] font-bold uppercase text-indigo-500">Draft Content</div>
                                    &ldquo;Hi! We loved working with you. Would you mind sharing your experience with us? It helps us out a lot!&rdquo;
                                </div>
                                <Button
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold uppercase tracking-widest text-xs gap-3 shadow-lg shadow-indigo-500/20"
                                    onClick={handleSend}
                                    disabled={isSending || !recipient}
                                >
                                    {isSending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send Review Invite
                                </Button>
                                <button
                                    onClick={handleCopy}
                                    className="w-full text-center text-[10px] font-bold text-zinc-400 hover:text-indigo-500 uppercase tracking-widest py-2 transition-colors"
                                >
                                    {hasCopied ? "Link Copied!" : "Or Copy Direct Link Instead"}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'feedback' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Textarea
                                placeholder="What could we have done better?"
                                value={internalFeedback}
                                onChange={(e) => setInternalFeedback(e.target.value)}
                                className="min-h-[150px] bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.08] rounded-2xl p-4 text-sm"
                            />
                            <Button
                                className="w-full h-12 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-bold uppercase tracking-widest text-xs gap-3"
                                onClick={handleFeedbackSubmit}
                                disabled={isSending || !internalFeedback.trim()}
                            >
                                {isSending ? <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                                Submit Private Feedback
                            </Button>
                        </div>
                    )}
                </div>

                {step !== 'rating' && (
                    <div className="px-8 py-4 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/[0.05] flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                        <span>Powered by GHL Lite</span>
                        <button onClick={() => setStep('rating')} className="hover:text-indigo-500 transition-colors">Go Back</button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
