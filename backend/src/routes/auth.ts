import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateToken } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, fullName, email, studentId, password, classYear, department } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }, { studentId }] },
    });
    if (existing) {
      res.status(409).json({ error: 'Username, email, or student ID already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, fullName, email, studentId, passwordHash, classYear, department },
    });

    const token = generateToken({ userId: user.id, username: user.username });
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ userId: user.id, username: user.username });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export default router;
