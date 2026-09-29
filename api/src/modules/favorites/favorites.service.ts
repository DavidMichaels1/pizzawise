import type { Crust, PrismaClient, Sauce, Size, Topping } from '@prisma/client';

export interface FavoriteInput {
  name: string;
  size: Size;
  crust: Crust;
  sauce: Sauce;
  toppings: Topping[];
}

export function createFavorite(prisma: PrismaClient, userId: string, input: FavoriteInput) {
  return prisma.favorite.create({ data: { userId, ...input } });
}

export function listFavorites(prisma: PrismaClient, userId: string) {
  return prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

/** Scoping the delete to userId in one query prevents deleting another user's favorite by guessing an id. */
export async function deleteFavorite(prisma: PrismaClient, userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.favorite.deleteMany({ where: { id, userId } });
  return count > 0;
}
