import { prisma } from './prisma';

const DEFAULT_EMAIL = 'ojan@dompet.app';

/**
 * Mendapatkan default user untuk single-user app.
 * Auto-create jika belum ada (graceful untuk fresh database).
 */
export async function getDefaultUser() {
  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEFAULT_EMAIL,
        name: 'Ojan',
      },
    });
  }

  return user;
}

/**
 * Mendapatkan current user (untuk server components/actions/routes)
 */
export async function getCurrentUser() {
  return getDefaultUser();
}
