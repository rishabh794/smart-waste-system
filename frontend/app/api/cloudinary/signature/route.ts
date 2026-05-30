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

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${parsed.apiSecret}`;
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");

  return NextResponse.json({
    cloudName: parsed.cloudName,
    apiKey: parsed.apiKey,
    timestamp,
    folder,
    signature,
  });
}
