import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { users } from '../db/schema/index.js';
import {
  getValidationErrorMessage,
  googleLoginBodySchema,
  loginBodySchema,
  signupBodySchema,
} from '../validation/schemas.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
if (!ACCESS_TOKEN_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export const signupUser = async (req: Request, res: Response): Promise<any> => {
  const parsedBody = signupBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { name, email, password, phone } = parsedBody.data;

  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [createdUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        phone,
        role: 'user',
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    if (!createdUser) {
      return res.status(500).json({ error: 'Failed to create account' });
    }

    return res.status(201).json(createdUser);
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  const parsedBody = loginBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { email, password } = parsedBody.data;

  try {
    const result = await db.select().from(users).where(eq(users.email, email));
    const user = result[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginWithGoogle = async (req: Request, res: Response): Promise<any> => {
  const parsedBody = googleLoginBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  if (!googleClient || !GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth client is not configured' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsedBody.data.idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    if (payload.email_verified === false) {
      return res.status(401).json({ error: 'Google account email is not verified' });
    }

    const email = payload.email.trim();
    const name = payload.name?.trim() || email.split('@')[0] || 'Citizen';

    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const existingUser = existingUsers[0];

    if (existingUser) {
      if (existingUser.role !== 'user') {
        return res.status(403).json({ error: 'Citizen access required' });
      }

      const accessToken = jwt.sign(
        { id: existingUser.id, role: existingUser.role },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        accessToken,
      });
    }

    const generatedPassword = randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    const [createdUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: 'user',
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    if (!createdUser) {
      return res.status(500).json({ error: 'Failed to create account' });
    }

    const accessToken = jwt.sign(
      { id: createdUser.id, role: createdUser.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      ...createdUser,
      accessToken,
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(401).json({ error: 'Invalid Google token' });
  }
};
