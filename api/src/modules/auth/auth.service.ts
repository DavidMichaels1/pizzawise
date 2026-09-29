import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export class EmailInUseError extends Error {}
export class InvalidCredentialsError extends Error {}

export async function registerUser(
  prisma: PrismaClient,
  email: string,
  password: string,
  name: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new EmailInUseError();

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.create({ data: { email, passwordHash, name } });
}

export async function verifyCredentials(prisma: PrismaClient, email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new InvalidCredentialsError();
  }
  return user;
}
