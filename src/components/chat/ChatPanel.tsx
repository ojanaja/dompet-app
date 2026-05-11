'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, Loader2, Image as ImageIcon } from 'lucide-react';
import { parseTransactionMessageAction, parseTransactionImageAction } from '@/actions/ai.actions';
import { createTransactionAction } from '@/actions/transaction.actions';
import type { Prisma } from '@prisma/client';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isError?: boolean;
    transactionInfo?: {
        type: 'INCOME' | 'EXPENSE';
        amount: number;
        title: string;
    };
};

export function ChatPanel() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Ada pengeluaran atau pemasukan yang mau dicatat?\n\nKetik saja, misalnya:\n• "Makan siang 50rb"\n• "Gajian 5jt"\n• "Bayarin makan temen Andi 100rb"\n\nAtau upload gambar struk/kwitansi untuk diproses otomatis!'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        const newId = Date.now().toString();

        setMessages(prev => [...prev, { id: newId, role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const parseResult = await parseTransactionMessageAction(userMessage);

            if (!parseResult.success || !parseResult.data) {
                throw new Error(parseResult.error || "Gagal memahami input.");
            }

            const parsedData = parseResult.data;

            const transactionData: Omit<Prisma.TransactionUncheckedCreateInput, 'userId'> = {
                amount: parsedData.amount,
                title: parsedData.title,
                type: parsedData.type,
                notes: parsedData.notes || `Kategori: ${parsedData.categorySuggested}`,
                metadata: parsedData as any,
            };

            const createResult = await createTransactionAction(transactionData);

            if (!createResult.success || !createResult.data) {
                setMessages(prev => [...prev, {
                    id: newId + '-resp',
                    role: 'assistant',
                    content: `Parsed: ${parsedData.title} Rp${parsedData.amount.toLocaleString('id-ID')}. Gagal simpan ke database.`,
                    isError: true,
                }]);
            } else {
                const { aiFeedback } = createResult.data;
                setMessages(prev => [...prev, {
                    id: newId + '-resp',
                    role: 'assistant',
                    content: aiFeedback,
                    transactionInfo: {
                        type: parsedData.type,
                        amount: parsedData.amount,
                        title: parsedData.title,
                    },
                }]);
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages(prev => [...prev, {
                id: newId + '-err',
                role: 'assistant',
                content: `Error: ${errorMessage}`,
                isError: true,
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!file || !file.type.startsWith('image/')) {
            setMessages(prev => [...prev, {
                id: Date.now().toString() + '-err',
                role: 'assistant',
                content: 'File harus berupa gambar (JPEG, PNG, dll).',
                isError: true,
            }]);
            return;
        }

        setIsUploading(true);
        const newId = Date.now().toString();

        setMessages(prev => [...prev, { 
            id: newId, 
            role: 'user', 
            content: `📷 Upload gambar: ${file.name}` 
        }]);

        try {
            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data:image/jpeg;base64, prefix
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const base64Data = await base64Promise;

            const parseResult = await parseTransactionImageAction(base64Data, file.type);

            if (!parseResult.success || !parseResult.data) {
                throw new Error(parseResult.error || "Gagal memproses gambar.");
            }

            const parsedData = parseResult.data;

            const transactionData: Omit<Prisma.TransactionUncheckedCreateInput, 'userId'> = {
                amount: parsedData.amount,
                title: parsedData.title,
                type: parsedData.type,
                notes: parsedData.notes || `Kategori: ${parsedData.categorySuggested}`,
                metadata: parsedData as any,
            };

            const createResult = await createTransactionAction(transactionData);

            if (!createResult.success || !createResult.data) {
                setMessages(prev => [...prev, {
                    id: newId + '-resp',
                    role: 'assistant',
                    content: `Parsed dari gambar: ${parsedData.title} Rp${parsedData.amount.toLocaleString('id-ID')}. Gagal simpan ke database.`,
                    isError: true,
                }]);
            } else {
                const { aiFeedback } = createResult.data;
                setMessages(prev => [...prev, {
                    id: newId + '-resp',
                    role: 'assistant',
                    content: aiFeedback,
                    transactionInfo: {
                        type: parsedData.type,
                        amount: parsedData.amount,
                        title: parsedData.title,
                    },
                }]);
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages(prev => [...prev, {
                id: newId + '-err',
                role: 'assistant',
                content: `Error memproses gambar: ${errorMessage}`,
                isError: true,
            }]);
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-foreground text-background rounded-2xl rounded-br-sm'
                                    : msg.isError
                                        ? 'text-danger/80 bg-danger/5 border border-danger/10 rounded-2xl rounded-bl-sm'
                                        : 'bg-card border border-border-subtle text-foreground/90 rounded-2xl rounded-bl-sm'
                            }`}
                        >
                            <p className="whitespace-pre-line">{msg.content}</p>
                            {msg.transactionInfo && (
                                <div className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono ${
                                    msg.transactionInfo.type === 'EXPENSE'
                                        ? 'bg-danger/10 text-danger'
                                        : 'bg-success/10 text-success'
                                }`}>
                                    <span>{msg.transactionInfo.type === 'EXPENSE' ? '−' : '+'}</span>
                                    <span>Rp{msg.transactionInfo.amount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-card border border-border-subtle px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading || isUploading}
                        placeholder="Tulis transaksi..."
                        className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-muted placeholder-muted-foreground disabled:opacity-40 transition-colors"
                    />
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={isLoading || isUploading}
                        className="flex-shrink-0 p-3 bg-card border border-border text-foreground/70 rounded-xl hover:bg-card/80 hover:text-foreground focus:outline-none disabled:opacity-40 transition-all active:scale-95"
                        title="Upload gambar struk/kwitansi"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    </button>
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || isUploading}
                        className="flex-shrink-0 p-3 bg-foreground text-background rounded-xl hover:bg-foreground/90 focus:outline-none disabled:opacity-20 transition-all active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <div className="mt-2 text-xs text-muted-foreground text-center">
                    Upload gambar struk, kwitansi, atau bukti transaksi untuk diproses otomatis
                </div>
            </div>
        </div>
    );
}
