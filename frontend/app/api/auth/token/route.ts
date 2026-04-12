import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';


export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Re-sign with same secret so Express can verify it
  const signed = jwt.sign(
    { id: token.id, role: token.role },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: '1h' }
  );

  return NextResponse.json({ token: signed });
}