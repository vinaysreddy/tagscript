import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
    ];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for large transcripts

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to estimate tokens (rough approximation)
const estimateTokens = (text) => {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
};

// Helper function to split transcript into chunks
const splitTranscriptIntoChunks = (transcript, maxTokensPerChunk = 4000, hasTimestamps = false) => {
    const maxCharsPerChunk = maxTokensPerChunk * 4;
    const chunks = [];

    if (hasTimestamps) {
        // For transcripts with timestamps, try to split at timestamp boundaries
        const lines = transcript.split('\n');
        let currentChunk = '';
        let currentLength = 0;
        let lineCount = 0;

        for (const line of lines) {
            const lineLength = line.length;

            // Check if this line starts with a timestamp
            const timestampMatch = line.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);

            // Force chunk creation if we're getting too large
            if (currentLength + lineLength > maxCharsPerChunk && currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = line;
                currentLength = lineLength;
                lineCount = 1;
            } else if (timestampMatch && currentChunk && (currentLength > maxCharsPerChunk * 0.7 || lineCount > 50)) {
                // Start a new chunk at this timestamp if current chunk is 70% full or has many lines
                chunks.push(currentChunk.trim());
                currentChunk = line;
                currentLength = lineLength;
                lineCount = 1;
            } else {
                // Add line to current chunk
                currentChunk += (currentChunk ? '\n' : '') + line;
                currentLength += lineLength;
                lineCount++;
            }
        }

        // Add the last chunk if it has content
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        // If we still only have 1 chunk and it's very large, force split it
        if (chunks.length === 1 && chunks[0].length > maxCharsPerChunk * 2) {
            const largeChunk = chunks[0];
            const lines = largeChunk.split('\n');
            const midPoint = Math.floor(lines.length / 2);

            chunks[0] = lines.slice(0, midPoint).join('\n');
            chunks.push(lines.slice(midPoint).join('\n'));
        }
    } else {
        // Original logic for transcripts without timestamps
        let currentChunk = '';
        let currentLength = 0;

        // Split by sentences to maintain context
        const sentences = transcript.split(/(?<=[.!?])\s+/);

        for (const sentence of sentences) {
            const sentenceLength = sentence.length;

            if (currentLength + sentenceLength > maxCharsPerChunk && currentChunk) {
                // Current chunk is full, save it and start a new one
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
                currentLength = sentenceLength;
            } else {
                // Add sentence to current chunk
                currentChunk += (currentChunk ? ' ' : '') + sentence;
                currentLength += sentenceLength;
            }
        }

        // Add the last chunk if it has content
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
    }

    return chunks;
};

// Helper to normalize a timestamp string to hh:mm:ss
const normalizeToHHMMSS = (timeStr) => {
    if (!timeStr) return '00:00:00';
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
        return parts.map(p => p.toString().padStart(2, '0')).join(':');
    } else if (parts.length === 2) {
        // If minutes > 59, convert to hours
        let min = parts[0];
        let sec = parts[1];
        let hr = 0;
        if (min > 59) {
            hr = Math.floor(min / 60);
            min = min % 60;
        }
        return `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    } else if (parts.length === 1) {
        return `00:00:${parts[0].toString().padStart(2, '0')}`;
    }
    return '00:00:00';
};

// Update processChaptersWithTimestamps to normalize timestamps
const processChaptersWithTimestamps = (chapters, timestamps) => {
    if (!timestamps || timestamps.length === 0) return chapters.map(chapter => ({
        ...chapter,
        start: chapter.start ? normalizeToHHMMSS(chapter.start) : undefined,
        end: chapter.end ? normalizeToHHMMSS(chapter.end) : undefined,
    }));

    // Find the closest timestamp for each chapter
    return chapters.map(chapter => {
        const chapterTime = parseTimeToSeconds(chapter.start);
        let closestTimestamp = timestamps[0];
        let minDifference = Math.abs(parseTimeToSeconds(timestamps[0].start) - chapterTime);

        for (const timestamp of timestamps) {
            const difference = Math.abs(parseTimeToSeconds(timestamp.start) - chapterTime);
            if (difference < minDifference) {
                minDifference = difference;
                closestTimestamp = timestamp;
            }
        }

        return {
            ...chapter,
            start: normalizeToHHMMSS(closestTimestamp.start),
            end: normalizeToHHMMSS(closestTimestamp.end)
        };
    });
};

// Helper function to parse time string to seconds
const parseTimeToSeconds = (timeStr) => {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        // Format: HH:MM:SS
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
        // Format: MM:SS
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
};

// Helper function to analyze a single chunk
const analyzeChunk = async (chunk, chunkIndex, totalChunks, chunkStartTime = 0, hasTimestamps = false, timestamps = []) => {
    const prompt = `Analyze this transcript chunk (part ${chunkIndex + 1} of ${totalChunks}) and return a JSON response with the following structure:

${hasTimestamps ? `{
  "tags": ["tag1", "tag2", "tag3"],
  "chapters": [
    {"start": "00:00:00", "summary": "Brief chapter summary"}
  ],
  "ad_safety": "✅ Safe" or "⚠️ Needs Review" or "❌ Unsafe",
  "ad_safety_reason": "Specific reason based on content found",
  "key_topics": ["topic1", "topic2"],
  "sentiment": "positive" or "neutral" or "negative"
}` : `{
  "tags": ["tag1", "tag2", "tag3"],
  "chapters": [
    {"summary": "Brief chapter summary"}
  ],
  "ad_safety": "✅ Safe" or "⚠️ Needs Review" or "❌ Unsafe",
  "ad_safety_reason": "Specific reason based on content found",
  "key_topics": ["topic1", "tag2"],
  "sentiment": "positive" or "neutral" or "negative"
}`}

Guidelines:
- Extract 3-4 relevant content themes/tags that describe the main topics discussed (e.g., "Financial Disputes", "Legal Proceedings", "Business Strategy", "Personal Branding")
- Create 1-2 chapter summaries ${hasTimestamps ? 'with timestamps from the provided timestamp list in hh:mm:ss format' : 'WITHOUT ANY TIMESTAMPS - do not include "start" field in chapters'}
- For ad safety, classify this chunk and provide a specific reason based on the actual content found
- Identify 2-3 key topics discussed
- Assess overall sentiment of this chunk

${hasTimestamps ? `IMPORTANT: Use only these timestamps in hh:mm:ss format: ${timestamps.map(t => t.start).join(', ')}` : 'IMPORTANT: Do NOT include any timestamps in chapters. Only include "summary" field.'}

Transcript chunk to analyze:
${chunk}

Return only valid JSON:`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a content analysis expert. Always return valid JSON format.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 600,
        });

        let content = completion.choices[0].message.content.trim();
        if (content.startsWith('```json')) content = content.slice(7);
        if (content.endsWith('```')) content = content.slice(0, -3);

        let result;
        try {
            result = JSON.parse(content);
        } catch (err) {
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                result = JSON.parse(match[0]);
            } else {
                throw new Error('Could not parse JSON from OpenAI response');
            }
        }

        // Calculate actual timestamps based on chunk position
        if (result.chapters) {
            result.chapters = result.chapters.map(chapter => {
                // Remove complex timestamp processing to avoid errors
                return {
                    ...chapter,
                    chunk: chunkIndex + 1
                };
            });
        }

        return {
            ...result,
            chunkIndex,
            chunkLength: chunk.length,
            chunkStartTime,
            chunkEndTime: chunkStartTime + Math.ceil(chunk.length / 200) // Rough estimate: 200 chars per minute
        };
    } catch (error) {
        console.error(`Error analyzing chunk ${chunkIndex + 1}:`, error);
        throw error;
    }
};

// Helper function to combine chunk results
const combineChunkResults = (chunkResults, originalTranscript, timestamps) => {
    // Combine tags (remove duplicates, keep most frequent)
    const tagCounts = {};
    chunkResults.forEach(chunk => {
        if (chunk.tags) {
            chunk.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    const combinedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([tag]) => tag);

    // Combine chapters with adjusted timestamps
    const combinedChapters = [];

    chunkResults.forEach((chunk, chunkIndex) => {
        if (chunk.chapters) {
            chunk.chapters.forEach(chapter => {
                combinedChapters.push({
                    ...chapter,
                    chunk: chunkIndex + 1
                });
            });
        }
    });

    // Sort chapters by timestamp if available, otherwise keep original order
    if (timestamps && timestamps.length > 0) {
        // Remove problematic timestamp sorting to avoid errors
        // combinedChapters.sort((a, b) => {
        //     if (!a.start || !b.start) return 0;
        //     const timeA = a.start.split(':').map(Number);
        //     const timeB = b.start.split(':').map(Number);
        //     return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        // });
    } else {
        // Ensure no timestamps are present when none should be
        combinedChapters.forEach(chapter => {
            if (chapter.start || chapter.end) {
                const { start, end, ...rest } = chapter;
                Object.assign(chapter, rest);
            }
        });
    }

    // Determine overall ad safety (most restrictive wins)
    const safetyScores = { '✅ Safe': 1, '⚠️ Needs Review': 2, '❌ Unsafe': 3 };
    let overallSafety = '⚠️ Needs Review';
    let overallSafetyReason = 'Content requires review';

    chunkResults.forEach(chunk => {
        const currentScore = safetyScores[chunk.ad_safety] || 2;
        const worstScore = safetyScores[overallSafety] || 2;
        if (currentScore > worstScore) {
            overallSafety = chunk.ad_safety;
            overallSafetyReason = chunk.ad_safety_reason || 'Content requires review';
        }
    });

    // Combine key topics
    const topicCounts = {};
    chunkResults.forEach(chunk => {
        if (chunk.key_topics) {
            chunk.key_topics.forEach(topic => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        }
    });

    const combinedTopics = Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);

    // Calculate overall sentiment
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    chunkResults.forEach(chunk => {
        if (chunk.sentiment) {
            sentimentCounts[chunk.sentiment]++;
        }
    });

    const overallSentiment = Object.entries(sentimentCounts)
        .sort(([, a], [, b]) => b - a)[0][0];

    return {
        tags: combinedTags,
        chapters: combinedChapters,
        ad_safety: overallSafety,
        ad_safety_reason: overallSafetyReason,
        key_topics: combinedTopics,
        sentiment: overallSentiment,
        chunk_analysis: chunkResults,
        total_chunks: chunkResults.length,
        original_length: originalTranscript.length,
        analyzed_length: chunkResults.reduce((sum, chunk) => sum + chunk.chunkLength, 0),
    };
};

app.get('/', (req, res) => {
    res.json({ message: 'MediaIQ Node.js API is running', version: '1.0.0' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', openai_key_configured: !!process.env.OPENAI_API_KEY });
});

app.post('/analyze', async (req, res) => {
    const { transcript, timestamps } = req.body;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
        return res.status(400).json({ error: 'Transcript cannot be empty' });
    }

    const originalLength = transcript.length;
    const estimatedTokens = estimateTokens(transcript);
    const hasTimestamps = timestamps && timestamps.length > 0;

    try {
        let result;

        if (estimatedTokens > 6000 || hasTimestamps) {
            // Use chunked analysis for long transcripts OR when timestamps are present
            console.log(`${hasTimestamps ? 'Timestamps detected' : 'Long transcript detected'} (${estimatedTokens} tokens). Using chunked analysis.`);

            const chunks = splitTranscriptIntoChunks(transcript, 4000, hasTimestamps);
            console.log(`Split into ${chunks.length} chunks for analysis`);
            console.log(`Chunk sizes: ${chunks.map((chunk, i) => `Chunk ${i + 1}: ${chunk.length} chars`).join(', ')}`);

            // Calculate start times for each chunk based on character position
            const chunkStartTimes = [];
            let currentPosition = 0;

            for (let i = 0; i < chunks.length; i++) {
                chunkStartTimes.push(Math.floor(currentPosition / 200)); // 200 chars per minute estimate
                currentPosition += chunks[i].length;
            }

            // Analyze each chunk with correct start times
            const chunkPromises = chunks.map((chunk, index) =>
                analyzeChunk(chunk, index, chunks.length, chunkStartTimes[index], hasTimestamps, timestamps)
            );

            const chunkResults = await Promise.all(chunkPromises);

            // Post-process chunk results to remove timestamps if none should be present
            if (!hasTimestamps) {
                chunkResults.forEach(chunk => {
                    if (chunk.chapters) {
                        chunk.chapters = chunk.chapters.map(chapter => {
                            const { start, end, ...rest } = chapter;
                            return rest;
                        });
                    }
                });
            }

            // Combine results
            result = combineChunkResults(chunkResults, transcript, timestamps);

            result.warning = `Transcript analyzed in ${chunks.length} chunks for comprehensive coverage`;
            result.analysis_method = 'chunked';

        } else {
            // Use single analysis for shorter transcripts
            console.log(`Short transcript detected (${estimatedTokens} tokens). Using single analysis.`);

            const prompt = `Analyze this transcript and return a JSON response with the following structure:

${hasTimestamps ? `{
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "chapters": [
    {"start": "00:00:00", "summary": "Brief chapter summary"},
    {"start": "00:05:30", "summary": "Brief chapter summary"},
    {"start": "00:12:45", "summary": "Brief chapter summary"}
  ],
  "ad_safety": "✅ Safe" or "⚠️ Needs Review" or "❌ Unsafe",
  "ad_safety_reason": "Specific reason based on content found",
  "key_topics": ["topic1", "topic2", "topic3"],
  "sentiment": "positive" or "neutral" or "negative"
}` : `{
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "chapters": [
    {"summary": "Brief chapter summary"},
    {"summary": "Brief chapter summary"},
    {"summary": "Brief chapter summary"}
  ],
  "ad_safety": "✅ Safe" or "⚠️ Needs Review" or "❌ Unsafe",
  "ad_safety_reason": "Specific reason based on content found",
  "key_topics": ["topic1", "topic2", "topic3"],
  "sentiment": "positive" or "neutral" or "negative"
}`}

Guidelines:
- Extract 4-6 relevant content themes/tags that describe the main topics discussed (e.g., "Financial Disputes", "Legal Proceedings", "Business Strategy", "Personal Branding")
- Create 3-6 chapter summaries ${hasTimestamps ? 'with timestamps from the provided timestamp list in hh:mm:ss format' : 'WITHOUT ANY TIMESTAMPS - do not include "start" field in chapters'}
- For ad safety, classify as:
  * ✅ Safe: Family-friendly, no controversial content
  * ⚠️ Needs Review: Some mature themes, mild language, or sensitive topics
  * ❌ Unsafe: Explicit content, strong language, or highly controversial topics
- Provide a specific reason for the ad safety classification based on actual content found
- Identify 3-5 key topics discussed
- Assess overall sentiment

${hasTimestamps ? `IMPORTANT: Use only these timestamps in hh:mm:ss format: ${timestamps.map(t => t.start).join(', ')}` : 'IMPORTANT: Do NOT include any timestamps in chapters. Only include "summary" field.'}

Transcript to analyze:
${transcript}

Return only valid JSON:`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a content analysis expert. Always return valid JSON format.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                max_tokens: 800,
            });

            let content = completion.choices[0].message.content.trim();
            if (content.startsWith('```json')) content = content.slice(7);
            if (content.endsWith('```')) content = content.slice(0, -3);

            try {
                result = JSON.parse(content);
            } catch (err) {
                const match = content.match(/\{[\s\S]*\}/);
                if (match) {
                    result = JSON.parse(match[0]);
                } else {
                    throw new Error('Could not parse JSON from OpenAI response');
                }
            }

            // Process timestamps if available
            if (hasTimestamps && result.chapters) {
                // Remove problematic timestamp processing
                // result.chapters = processChaptersWithTimestamps(result.chapters, timestamps);
            } else if (!hasTimestamps && result.chapters) {
                // Remove timestamps from chapters if none are available
                result.chapters = result.chapters.map(chapter => {
                    const { start, end, ...rest } = chapter;
                    return rest;
                });
            }

            result.analysis_method = 'single';
            result.original_length = originalLength;
            result.analyzed_length = originalLength;
        }

        if (!result.tags || !result.chapters || !result.ad_safety) {
            return res.status(500).json({ error: 'Incomplete analysis result from OpenAI' });
        }

        res.json(result);

    } catch (error) {
        console.error('OpenAI error:', error);

        if (error.code === 'rate_limit_exceeded') {
            res.status(429).json({
                error: 'Rate limit exceeded. Please try again in a moment.',
                details: error.message
            });
        } else {
            res.status(500).json({ error: 'OpenAI API error', details: error.message });
        }
    }
});

app.listen(port, () => {
    console.log(`MediaIQ Node.js backend running on port ${port}`);
}); 