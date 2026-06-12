import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || '',
  adminUsername: process.env.ADMIN_USERNAME || '',
};

if (!process.env.JWT_SECRET) {
  console.warn('[config] WARNING: JWT_SECRET not set. Using insecure fallback. Set JWT_SECRET in production.');
}
if (!process.env.ADMIN_USERNAME) {
  console.warn('[config] WARNING: ADMIN_USERNAME not set. Admin endpoints will reject all requests.');
}
