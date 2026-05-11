'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function registerAction(name: string, email: string, password: string) {
    try {
        if (!name || !email || !password) {
            return { success: false, error: 'Semua field wajib diisi' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password minimal 6 karakter' };
        }

        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            return { success: false, error: 'Email sudah terdaftar' };
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.create({
            data: {
                name,
                email,
                hashedPassword,
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('Register error:', error);
        return { success: false, error: 'Terjadi kesalahan sistem' };
    }
}
