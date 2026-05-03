import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getValidationErrorMessage, loginBodySchema, signupBodySchema } from '../validation/schemas.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!ACCESS_TOKEN_SECRET) {
  throw new Error('JWT_SECRET or NEXTAUTH_SECRET is not defined in environment');
}

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
