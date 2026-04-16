import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { getValidationErrorMessage, loginBodySchema } from '../validation/schemas.js';

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

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};