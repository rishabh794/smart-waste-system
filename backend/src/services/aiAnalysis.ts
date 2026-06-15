import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { reportAiAnalyses } from '../db/schema/index.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const REQUEST_TIMEOUT_MS = 30_000;

const ANALYSIS_PROMPT = `You are a waste management AI. Analyze this image and determine if it shows a valid waste or garbage report.

Return ONLY a JSON object with these exact fields:
{
  "isValidReport": boolean,       // true if the image shows real waste, garbage, litter, or a legitimate waste-related issue
  "confidenceScore": number,      // 0 to 100, how confident you are in your assessment
  "severity": "low" | "medium" | "high" | "critical",  // severity of the waste issue shown
  "category": "organic" | "bulk" | "recyclable" | "hazardous" | "general",  // type of waste visible
  "reason": string                // brief 1-2 sentence explanation of your analysis
}

Guidelines:
- If the image does not contain waste, garbage, or a waste-related issue, set isValidReport to false.
- "critical" severity is for hazardous materials, medical waste, or situations posing immediate danger.
- "high" severity is for large illegal dumps, overflowing bins blocking pathways, etc.
- "medium" severity is for moderately overflowing bins or scattered litter.
- "low" severity is for minor litter or a single misplaced item.

Return ONLY the JSON object, no markdown, no code fences.`;

interface AiAnalysisResult {
  isValidReport: boolean;
  confidenceScore: number;
  severity: string;
  category: string;
  reason: string;
}

/**
 * Fetches an image from a URL and returns it as a Base64 string with its MIME type.
 */
const fetchImageAsBase64 = async (
  imageUrl: string,
  signal: AbortSignal
): Promise<{ base64: string; mimeType: string }> => {
  const response = await fetch(imageUrl, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch image from Cloudinary: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return { base64, mimeType: (contentType.split(';')[0] ?? 'image/jpeg').trim() };
};

/**
 * Calls the Gemini API with the image and parses the structured JSON response.
 */
const callGemini = async (
  base64: string,
  mimeType: string,
  signal: AbortSignal
): Promise<AiAnalysisResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
          {
            text: ANALYSIS_PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  };

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  // Strip potential markdown code fences just in case
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned) as AiAnalysisResult;

  // Validate essential fields
  if (typeof parsed.isValidReport !== 'boolean' || typeof parsed.confidenceScore !== 'number') {
    throw new Error(`Gemini returned malformed JSON: ${cleaned}`);
  }

  return parsed;
};

/**
 * Runs the full AI analysis pipeline for a report.
 * This is meant to be called fire-and-forget from the controller.
 */
export const analyzeReportImage = async (reportId: string, imageUrl: string): Promise<void> => {
  // Step 1: Insert a pending row
  await db.insert(reportAiAnalyses).values({
    reportId,
    status: 'pending',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Step 2: Fetch image and convert to Base64
    const { base64, mimeType } = await fetchImageAsBase64(imageUrl, controller.signal);

    // Step 3: Call Gemini
    const result = await callGemini(base64, mimeType, controller.signal);

    // Step 4: Update with results
    await db
      .update(reportAiAnalyses)
      .set({
        status: 'completed',
        isValidReport: result.isValidReport,
        confidenceScore: Math.max(0, Math.min(100, Math.round(result.confidenceScore))),
        severity: result.severity,
        category: result.category,
        reason: result.reason,
      })
      .where(eq(reportAiAnalyses.reportId, reportId));

    console.log(`[AI] Analysis completed for report ${reportId}: valid=${result.isValidReport}, confidence=${result.confidenceScore}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[AI] Analysis failed for report ${reportId}:`, message);

    await db
      .update(reportAiAnalyses)
      .set({
        status: 'failed',
        reason: `Analysis failed: ${message}`,
      })
      .where(eq(reportAiAnalyses.reportId, reportId))
      .catch((dbErr) => console.error(`[AI] Failed to update failure status:`, dbErr));
  } finally {
    clearTimeout(timeout);
  }
};
