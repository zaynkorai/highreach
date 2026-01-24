"use client";

import { useState } from "react";
import { uploadCSV } from "../actions";

interface CsvImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        success: number;
        failed: number;
        details?: any[];
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        // Client-side parse to simple string to send to server action
        // Alternatively we can send FormData directly. Sending FormData is cleaner for "upload".
        // But let's stick to parsing text to handle it easily in server action without complex multipart handling if not needed.
        // Actually, for Server Actions, we can just pass a string of the CSV if it's small, or use FormData.
        // Let's use FormData to be robust.

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await uploadCSV(formData);
            if (response.success) {
                setResult({
                    success: response.successCount || 0,
                    failed: response.failedCount || 0,
                    details: response.details
                });
                if (response.successCount && response.successCount > 0) {
                    onSuccess();
                }
            } else {
                setError(response.error || "Failed to upload CSV");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-md rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/[0.08] flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground">Import Contacts</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {!result ? (
                        <>
                            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                    {file ? file.name : "Click to upload or drag & drop"}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    CSV files only. Headers: firstName, lastName, email, phone
                                </p>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 font-medium py-2.5 rounded-lg transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-sm opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? "Uploading..." : "Import Contacts"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-6 flex flex-col max-h-[70vh]">
                            <div className="shrink-0 space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Import Complete</h3>
                                <div className="flex justify-center gap-6 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.success}</span>
                                        <span className="text-zinc-500">Imported</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold text-red-500 dark:text-red-400">{result.failed}</span>
                                        <span className="text-zinc-500">Skipped</span>
                                    </div>
                                </div>
                            </div>

                            {result.details && result.details.length > 0 && (
                                <div className="flex-1 overflow-y-auto text-left border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-3 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-1">Row-level failures</p>
                                    {result.details.map((detail, idx) => (
                                        <div key={idx} className="text-xs p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <span className="font-bold text-zinc-900 dark:text-zinc-200">Row {detail.row}:</span>
                                            <span className="text-zinc-500 ml-1">
                                                {Object.entries(detail.errors).map(([field, msgs]: [string, any]) =>
                                                    `${field}: ${msgs.join(', ')}`
                                                ).join('; ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="shrink-0 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
