import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

async function proxyRequest(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || typeof token.accessToken !== "string" || token.accessToken.length === 0) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const params = await context.params;
  const path = params?.path?.join("/") || "";
  const url = new URL(req.url);
  const targetUrl = `${backendBaseUrl}/api/${path}${url.search}`;

  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${token.accessToken}`);
  headers.delete("host"); // Let the backend determine its own host

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // Required to proxy streaming bodies in Node.js
      duplex: "half",
    } as any);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
