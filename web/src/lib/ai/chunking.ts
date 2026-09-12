export interface DocumentChunk {
    content: string;
    tokenCount: number;
    chunkIndex: number;
    totalChunks: number;
    metadata?: Record<string, unknown>;
}

export interface ChunkOptions {
    maxChunkSize?: number; // Target characters per chunk (default: 500)
    overlap?: number;      // Overlapping characters between consecutive chunks (default: 60)
    metadata?: Record<string, unknown>;
}

/**
 * Estimates token count from text using standard 4 chars/token heuristic.
 */
export function estimateTokenCount(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return Math.max(1, Math.ceil(trimmed.length / 4));
}

/**
 * Recursively splits a text into semantic chunks respecting paragraphs,
 * headings, sentences, and words.
 */
export function chunkDocument(
    text: string,
    options: ChunkOptions = {}
): DocumentChunk[] {
    const maxChunkSize = options.maxChunkSize ?? 500;
    const overlap = options.overlap ?? 60;
    const baseMetadata = options.metadata ?? {};

    const cleanText = text.trim().replace(/\r\n/g, "\n");
    if (!cleanText) return [];

    if (cleanText.length <= maxChunkSize) {
        return [
            {
                content: cleanText,
                tokenCount: estimateTokenCount(cleanText),
                chunkIndex: 0,
                totalChunks: 1,
                metadata: { ...baseMetadata },
            },
        ];
    }

    // Split text hierarchically
    const rawSegments = splitIntoSegments(cleanText, maxChunkSize);
    
    // Group segments into chunks with overlap
    const chunks: string[] = [];
    let currentChunk = "";

    for (const segment of rawSegments) {
        if (!currentChunk) {
            currentChunk = segment;
        } else if ((currentChunk + "\n" + segment).length <= maxChunkSize) {
            currentChunk += (currentChunk.endsWith("\n") ? "" : "\n") + segment;
        } else {
            chunks.push(currentChunk.trim());

            // Build overlapping prefix for next chunk
            if (overlap > 0 && currentChunk.length > overlap) {
                const overlapText = currentChunk.slice(-overlap).trim();
                // Try to start at a word boundary
                const firstSpace = overlapText.indexOf(" ");
                const cleanOverlap = firstSpace > 0 ? overlapText.slice(firstSpace + 1) : overlapText;
                currentChunk = cleanOverlap + (cleanOverlap.endsWith("\n") ? "" : "\n") + segment;
            } else {
                currentChunk = segment;
            }
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    const totalChunks = chunks.length;

    return chunks.map((content, idx) => ({
        content,
        tokenCount: estimateTokenCount(content),
        chunkIndex: idx,
        totalChunks,
        metadata: {
            ...baseMetadata,
            chunkIndex: idx,
            totalChunks,
            charCount: content.length,
        },
    }));
}

/**
 * Splits text by natural delimiters (headings, paragraphs, newlines, sentences).
 */
function splitIntoSegments(text: string, maxChunkSize: number): string[] {
    // 1. First split on double newlines / paragraph boundaries
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const result: string[] = [];

    for (const para of paragraphs) {
        if (para.length <= maxChunkSize) {
            result.push(para);
        } else {
            // 2. Split on single newlines
            const lines = para.split(/\n/).map(l => l.trim()).filter(Boolean);
            for (const line of lines) {
                if (line.length <= maxChunkSize) {
                    result.push(line);
                } else {
                    // 3. Split on sentence boundaries
                    const sentences = line.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
                    for (const sent of sentences) {
                        if (sent.length <= maxChunkSize) {
                            result.push(sent);
                        } else {
                            // 4. Fallback to hard word chunking
                            const words = sent.split(/\s+/);
                            let subChunk = "";
                            for (const word of words) {
                                if (!subChunk) {
                                    subChunk = word;
                                } else if ((subChunk + " " + word).length <= maxChunkSize) {
                                    subChunk += " " + word;
                                } else {
                                    result.push(subChunk);
                                    subChunk = word;
                                }
                            }
                            if (subChunk) {
                                result.push(subChunk);
                            }
                        }
                    }
                }
            }
        }
    }

    return result;
}
