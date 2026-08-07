import { PrismaClient } from '@prisma/client';

/**
 * Единственный экземпляр Prisma на процесс.
 * В dev-режиме Next перезагружает модули, поэтому клиент кладём в globalThis —
 * иначе на каждой перезагрузке открывается новое соединение с SQLite.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Обёртка для чтения из БД на страницах: если база недоступна или запрос упал,
 * страница показывает запасное значение вместо белого экрана с ошибкой.
 */
export async function safeQuery<T>(
  label: string,
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error(`[db] ${label}:`, error);
    return fallback;
  }
}
