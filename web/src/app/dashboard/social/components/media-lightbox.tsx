"use client";

import React, { useEffect } from "react";
import { useSocialLightbox } from "@/stores/social-store";
import { X, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MediaLightbox() {
    const { activeUrl, close } = useSocialLightbox();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                close();
            }
        };
        if (activeUrl) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [activeUrl, close]);

    if (!activeUrl) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
            onClick={close}
        >
            {/* Top Toolbar */}
            <div
                className="absolute top-4 right-4 flex items-center gap-2 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <a
                    href={activeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-xs flex items-center gap-1.5 backdrop-blur-sm"
                    title="Open original media in new tab"
                >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Original</span>
                </a>

                <button
                    type="button"
                    onClick={close}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                    title="Close preview (Esc)"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Lightbox Media Container */}
            <div
                className="relative max-w-5xl max-h-[88vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={activeUrl}
                    alt="Media full preview"
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 select-none animate-in zoom-in-95 duration-200"
                />
            </div>
        </div>
    );
}
