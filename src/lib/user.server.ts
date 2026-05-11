import 'server-only';
import { prisma } from './prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Utility untuk mendapatkan current user dari session.
 */
export async function getDefaultUser() {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
        throw new Error("Unauthorized: Harap login terlebih dahulu.");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        throw new Error("User tidak ditemukan di database.");
    }

    return user;
}

/**
 * Mendapatkan current user (untuk server components/actions/routes)
 */
export async function getCurrentUser() {
  return getDefaultUser();
}
