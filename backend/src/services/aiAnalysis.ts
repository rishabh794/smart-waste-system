import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { reportAiAnalyses, reports } from '../db/schema/index.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const REQUEST_TIMEOUT_MS = 30_000;

const ANALYSIS_PROMPT = `You are a strict automated triage agent for a municipal waste department. Analyze this image and determine if it shows a valid waste, garbage, litter, or infrastructure damage report.

CRITICAL SCREEN DETECTION: You must determine if this image is a photograph of a real-world scene or a photograph of a digital display/screen showing garbage. 
Carefully analyze for the following signs of a digital screen:
- Moiré patterns (wavy, rainbow-like interference patterns)
- Visible pixel structure or RGB grid
- Screen reflections or glare from room lighting
- Device bezels, monitor frames, or edges of a physical screen in the frame
- Refresh artifacts or banding
- Flat, unnatural perspective or skewed angles typical of capturing a monitor

Return ONLY a JSON object with these exact fields:
{
  "isValidReport": boolean,       // true if it is a real-world photo of waste, false if it is a screen photo or NOT waste
  "confidenceScore": number,      // 0 to 100, how confident you are in your assessment
  "severity": "low" | "medium" | "high" | "critical",  // severity of the waste issue shown
  "category": "organic" | "bulk" | "recyclable" | "hazardous" | "general",  // type of waste visible
  "reason": string                // brief 1-2 sentence explanation of your analysis, noting screen detection evidence if applicable
}

Guidelines for Classification:

1. VALIDITY & FALLBACK:
- If you detect any signs that this is a photograph of a digital screen (moiré, pixels, bezels, etc.), you MUST set isValidReport to false and state the reason.
- If the image clearly shows real-world waste or a related issue, set isValidReport to true.
- If the image DOES NOT show waste (e.g., a selfie, a dog, a blurry black screen), set isValidReport to false. 
- IMPORTANT: If isValidReport is false, you MUST default severity to "low" and category to "general".

2. SEVERITY LEVELS:
- "critical": Hazardous materials, medical waste, active fires, or situations posing immediate danger to public safety.
- "high": Large illegal dumping sites, heavily overflowing bins blocking sidewalks, or dead animals.
- "medium": Moderately overflowing bins, scattered street litter, or damaged public bins.
- "low": Minor litter, a single misplaced item, or general cleanliness issues.

3. WASTE CATEGORIES:
- "organic": Food waste, yard trimmings, dead leaves, branches.
- "bulk": Furniture, mattresses, large appliances, construction debris.
- "recyclable": Cardboard boxes, clean plastics, glass bottles, metal cans.
- "hazardous": Batteries, paint cans, chemicals, medical waste, sharp objects.
- "general": Mixed municipal trash, unidentifiable bags of garbage, or street sweepings.

Return ONLY the JSON object. Do not include markdown formatting or code blocks.`;

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
 * Robustly parses JSON from Gemini output, handling common LLM quirks
 * like markdown fences, trailing commas, and single-quoted keys.
 */
const parseGeminiJson = <T>(raw: string): T => {
  // Step 1: Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  // Step 2: If the cleaned string doesn't start with '{', try to extract a JSON object
  if (!cleaned.startsWith('{')) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      cleaned = match[0];
    }
  }

  // Step 3: Try parsing as-is first (happy path with responseMimeType)
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall through to sanitization
  }

  // Step 4: Sanitize common LLM JSON issues
  let sanitized = cleaned
    // Remove single-line comments (// ...)
    .replace(/\/\/.*$/gm, '')
    // Remove trailing commas before } or ]
    .replace(/,\s*([}\]])/g, '$1')
    // Replace single-quoted strings with double-quoted strings
    // This regex matches single-quoted values that aren't inside double quotes
    .replace(/(\s*:\s*)'([^']*)'/g, '$1"$2"')
    // Replace single-quoted keys
    .replace(/'([^']+)'\s*:/g, '"$1":')
    .trim();

  return JSON.parse(sanitized) as T;
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
      responseMimeType: 'application/json',
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

  const parsed = parseGeminiJson<AiAnalysisResult>(rawText);

  // Validate essential fields
  if (typeof parsed.isValidReport !== 'boolean' || typeof parsed.confidenceScore !== 'number') {
    throw new Error(`Gemini returned malformed JSON: ${rawText.slice(0, 300)}`);
  }

  return parsed;
};

export const processAiAnalysisJob = async (reportId: string, imageUrl: string): Promise<void> => {
  // Step 1: Insert or update a pending row
  await db.insert(reportAiAnalyses).values({
    reportId,
    status: 'pending',
  }).onConflictDoUpdate({
    target: reportAiAnalyses.reportId,
    set: { status: 'pending' },
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Step 2: Fetch image and convert to Base64
    const { base64, mimeType } = await fetchImageAsBase64(imageUrl, controller.signal);

    // Step 3: Call Gemini
    const result = await callGemini(base64, mimeType, controller.signal);

    // Step 4: Update with results
    await db.transaction(async (tx) => {
      await tx
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

      if (!result.isValidReport) {
        await tx
          .update(reports)
          .set({
            status: 'rejected',
            adminNotes: `Automatically rejected by AI Analysis: ${result.reason}`,
          })
          .where(eq(reports.id, reportId));
      }
    });

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

    // Throw the error so BullMQ knows the job failed and can retry it
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
