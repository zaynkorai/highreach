import test from "node:test";
import assert from "node:assert/strict";
import {
    chunkDocument,
    estimateTokenCount,
} from "../lib/ai/chunking.ts";
import {
    generateEmbedding,
    generateEmbeddings,
    cosineSimilarity,
    createDeterministicEmbedding,
    EMBEDDING_DIMENSION,
} from "../lib/ai/embedding.ts";
import {
    mergeWithRRF,
    type SemanticSearchResult,
} from "../lib/ai/semantic-retrieval.ts";
import {
    knowledgeSourceSchema,
    knowledgeQuerySchema,
} from "../lib/validations/knowledge.ts";

test("Knowledge Base & Semantic Retrieval Unit Tests", async (t) => {
    // ─────────────────────────────────────────────────────────────
    // 1. Chunking & Token Estimation Tests
    // ─────────────────────────────────────────────────────────────
    await t.test("estimateTokenCount computes accurate token budgets", () => {
        assert.equal(estimateTokenCount(""), 0);
        assert.equal(estimateTokenCount("test"), 1);
        assert.equal(estimateTokenCount("12345678"), 2);
        const sample = "HighReach provides autonomous AI agents and speed to lead for local SMBs.";
        const tokens = estimateTokenCount(sample);
        assert.ok(tokens >= 15 && tokens <= 25, `Expected tokens around 18, got ${tokens}`);
    });

    await t.test("chunkDocument handles short text as single chunk", () => {
        const shortText = "HighReach AI-Native CRM and Speed to Lead platform.";
        const chunks = chunkDocument(shortText, { maxChunkSize: 200, overlap: 20 });
        assert.equal(chunks.length, 1);
        assert.equal(chunks[0].chunkIndex, 0);
        assert.equal(chunks[0].totalChunks, 1);
        assert.equal(chunks[0].content, shortText);
        assert.ok(chunks[0].tokenCount > 0);
    });

    await t.test("chunkDocument splits long multi-paragraph documents with overlap", () => {
        const para1 = "Section 1: Our emergency service covers plumbing, heating, and cooling 24/7 across the metropolitan area.";
        const para2 = "Section 2: Standard pricing is $99 for basic dispatch, with all labor backed by our 100% satisfaction guarantee.";
        const para3 = "Section 3: For after-hours emergencies, our response team arrives within 60 minutes or the service fee is waived.";
        const fullDoc = `${para1}\n\n${para2}\n\n${para3}`;

        const chunks = chunkDocument(fullDoc, { maxChunkSize: 130, overlap: 25 });
        assert.ok(chunks.length >= 2, `Expected at least 2 chunks, got ${chunks.length}`);

        // Verify indexing and metadata
        for (let i = 0; i < chunks.length; i++) {
            assert.equal(chunks[i].chunkIndex, i);
            assert.equal(chunks[i].totalChunks, chunks.length);
            assert.ok(chunks[i].tokenCount > 0);
        }

        // Verify that total content is preserved
        const allText = chunks.map(c => c.content).join(" ");
        assert.ok(allText.includes("emergency service"));
        assert.ok(allText.includes("Standard pricing"));
        assert.ok(allText.includes("after-hours emergencies"));
    });

    await t.test("chunkDocument handles empty or whitespace-only text gracefully", () => {
        assert.deepEqual(chunkDocument(""), []);
        assert.deepEqual(chunkDocument("    \n\n   "), []);
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Embedding & Vector Math Tests
    // ─────────────────────────────────────────────────────────────
    await t.test("EMBEDDING_DIMENSION is 1536 (OpenAI text-embedding-3-small standard)", () => {
        assert.equal(EMBEDDING_DIMENSION, 1536);
    });

    await t.test("generateEmbedding produces 1536-dimensional unit vector", async () => {
        const text = "Emergency HVAC repair service in Austin, Texas";
        const vector = await generateEmbedding(text);
        assert.equal(vector.length, 1536);

        // Verify unit normalization (||v||_2 ≈ 1.0)
        let sumSq = 0;
        for (const val of vector) {
            sumSq += val * val;
        }
        const norm = Math.sqrt(sumSq);
        assert.ok(Math.abs(norm - 1.0) < 0.01, `Expected unit norm ~1.0, got ${norm}`);
    });

    await t.test("generateEmbeddings handles batch processing consistently", async () => {
        const texts = ["First FAQ item", "Second service description", "Third pricing table"];
        const vectors = await generateEmbeddings(texts);
        assert.equal(vectors.length, 3);
        assert.equal(vectors[0].length, 1536);
        assert.equal(vectors[1].length, 1536);
        assert.equal(vectors[2].length, 1536);
    });

    await t.test("cosineSimilarity computes exact mathematical similarity", () => {
        const vecA = [1, 0, 0];
        const vecB = [1, 0, 0];
        const vecC = [0, 1, 0];
        const vecD = [-1, 0, 0];

        assert.equal(cosineSimilarity(vecA, vecB), 1.0);
        assert.equal(cosineSimilarity(vecA, vecC), 0.0);
        assert.equal(cosineSimilarity(vecA, vecD), -1.0);
        assert.equal(cosineSimilarity([], []), 0);
    });

    await t.test("Semantically related texts produce higher cosine similarity than unrelated texts", () => {
        const vQuery = createDeterministicEmbedding("emergency roof repair water leak");
        const vMatch = createDeterministicEmbedding("roofing repairs leak fix emergency service");
        const vUnrelated = createDeterministicEmbedding("chocolate chip cookies recipe oven temperature baking");

        const matchSim = cosineSimilarity(vQuery, vMatch);
        const unrelatedSim = cosineSimilarity(vQuery, vUnrelated);

        assert.ok(
            matchSim > unrelatedSim,
            `Match similarity (${matchSim.toFixed(3)}) should exceed unrelated similarity (${unrelatedSim.toFixed(3)})`
        );
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Reciprocal Rank Fusion (RRF) Hybrid Search Tests
    // ─────────────────────────────────────────────────────────────
    await t.test("mergeWithRRF boosts items present in both vector and keyword search results", () => {
        const item1: SemanticSearchResult = {
            chunkId: "chunk-1",
            sourceId: "source-1",
            title: "Pricing Guide",
            sourceType: "service_catalog",
            content: "Basic plan starts at $49/mo.",
            similarity: 0.88,
            tokenCount: 12,
            metadata: {},
        };

        const item2: SemanticSearchResult = {
            chunkId: "chunk-2",
            sourceId: "source-2",
            title: "FAQ",
            sourceType: "faq",
            content: "What are your business hours?",
            similarity: 0.82,
            tokenCount: 10,
            metadata: {},
        };

        const item3: SemanticSearchResult = {
            chunkId: "chunk-3",
            sourceId: "source-3",
            title: "Company Info",
            sourceType: "document",
            content: "About our mission.",
            similarity: 0.70,
            tokenCount: 8,
            metadata: {},
        };

        // Item 1 appears in both vector and keyword results
        // Item 2 appears only in vector
        // Item 3 appears only in keyword
        const vectorResults = [item1, item2];
        const keywordResults = [item1, item3];

        const merged = mergeWithRRF(vectorResults, keywordResults, 5, 60);

        assert.equal(merged.length, 3);
        // Item 1 should be ranked #1 because it has combined RRF score from both dense and sparse channels
        assert.equal(merged[0].chunkId, "chunk-1");
        assert.equal(merged[0].similarity, 0.88);
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Zod Validation Schemas
    // ─────────────────────────────────────────────────────────────
    await t.test("knowledgeSourceSchema accepts valid data and rejects invalid types", () => {
        const valid = {
            title: "Commercial Roof Inspection FAQs",
            sourceType: "faq",
            rawContent: "We provide comprehensive drone-based commercial roof inspections.",
        };
        const parsed = knowledgeSourceSchema.parse(valid);
        assert.equal(parsed.title, valid.title);
        assert.equal(parsed.sourceType, "faq");

        // Rejects empty title
        assert.throws(() => {
            knowledgeSourceSchema.parse({ ...valid, title: "" });
        });

        // Rejects invalid sourceType
        assert.throws(() => {
            knowledgeSourceSchema.parse({ ...valid, sourceType: "invalid_type" });
        });

        // Rejects too short content (< 5 chars)
        assert.throws(() => {
            knowledgeSourceSchema.parse({ ...valid, rawContent: "abc" });
        });
    });

    await t.test("knowledgeQuerySchema validates search input bounds", () => {
        const validQuery = {
            query: "What is your hourly rate?",
            maxResults: 10,
            minSimilarity: 0.7,
            sourceTypes: ["faq", "service_catalog"],
        };
        const parsed = knowledgeQuerySchema.parse(validQuery);
        assert.equal(parsed.query, "What is your hourly rate?");
        assert.equal(parsed.maxResults, 10);
        assert.equal(parsed.minSimilarity, 0.7);

        // Rejects empty query
        assert.throws(() => {
            knowledgeQuerySchema.parse({ query: "" });
        });

        // Rejects minSimilarity > 1
        assert.throws(() => {
            knowledgeQuerySchema.parse({ query: "test", minSimilarity: 1.5 });
        });
    });
});
