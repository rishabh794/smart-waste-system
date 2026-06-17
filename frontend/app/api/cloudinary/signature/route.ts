import crypto from "crypto";
import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const CLOUDINARY_URL_PATTERN = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/;

const parseCloudinaryUrl = (value: string) => {
  const match = value.match(CLOUDINARY_URL_PATTERN);

  if (!match) {
    return null;
  }

  return {
    apiKey: match[1],
    apiSecret: match[2],
    cloudName: match[3],
  };
};

// Simple in-memory rate limiting map for signatures (by user ID)
const signatureRateLimits = new Map<string, { count: number; timestamp: number }>();
const MAX_SIGNATURES_PER_HOUR = 20;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== "user" || !token.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limiting Logic
  const now = Date.now();
  const userId = token.sub;
  const userRateLimit = signatureRateLimits.get(userId) || { count: 0, timestamp: now };

  if (now - userRateLimit.timestamp > 60 * 60 * 1000) {
    // Reset after 1 hour
    userRateLimit.count = 1;
    userRateLimit.timestamp = now;
  } else {
    userRateLimit.count += 1;
  }

  signatureRateLimits.set(userId, userRateLimit);

  if (userRateLimit.count > MAX_SIGNATURES_PER_HOUR) {
    return NextResponse.json({ error: "Too many signature requests. Please try again later." }, { status: 429 });
  }

  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (!cloudinaryUrl) {
    return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 500 });
  }

  const parsed = parseCloudinaryUrl(cloudinaryUrl);

  if (!parsed) {
    return NextResponse.json({ error: "Invalid Cloudinary configuration" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "reports";
  const allowedFormats = "jpg,png,jpeg,webp";
  // Lexicographical order for signature: allowed_formats, folder, timestamp
  const signaturePayload = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}${parsed.apiSecret}`;
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");

  return NextResponse.json({
    cloudName: parsed.cloudName,
    apiKey: parsed.apiKey,
    timestamp,
    folder,
    allowedFormats,
    signature,
  });
}
