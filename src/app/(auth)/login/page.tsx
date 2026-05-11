'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/layout/GlassCard';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError('Email atau password salah.');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch {
            setError('Terjadi kesalahan sistem. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm z-10">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold tracking-tighter text-white font-mono uppercase">
                    DOMPET
                </h1>
                <p className="text-xs text-neutral-400 mt-1.5 uppercase tracking-widest font-medium">
                    Sarcastic AI Personal Finance
                </p>
            </div>

            <GlassCard className="p-6 border border-neutral-800 bg-neutral-900/40 backdrop-blur-md rounded-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono mb-1.5">
                            Alamat Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="fauzan@dompet.app"
                            className="w-full bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white placeholder-neutral-600 transition-colors font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono mb-1.5">
                            Kata Sandi
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white placeholder-neutral-600 transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-mono mt-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-white text-black font-semibold text-xs py-3 rounded-lg hover:bg-neutral-200 transition-colors duration-150 flex items-center justify-center gap-1.5 uppercase tracking-widest font-mono"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Masuk
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-5 border-t border-neutral-800/60 text-center">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                        Belum punya akun?{' '}
                        <Link href="/register" className="text-white hover:underline">
                            Daftar di sini
                        </Link>
                    </p>
                </div>
            </GlassCard>

            <p className="text-center text-[10px] text-neutral-600 mt-8 font-mono">
                Minimalist. Private. Sarcastic.
            </p>
        </div>
    );
}
