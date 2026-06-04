import 'server-only';
import { generateObject, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Definisi format output JSON yang kita ekspektasikan dari AI
export const TransactionSchema = z.object({
    amount: z.number().positive().describe("Total nilai uang (angka positif)"),
    title: z.string().describe("Judul transaksi yang singkat namun jelas"),
    type: z.enum(['INCOME', 'EXPENSE']).describe("Apakah ini pemasukan atau pengeluaran?"),
    categorySuggested: z.enum(['ESSENTIAL', 'LIFESTYLE', 'INCOME', 'PROJECT']).describe("Saran kategori: ESSENTIAL (makan, transport), LIFESTYLE (kopi, game), INCOME (pendapatan), PROJECT (proyek/bisnis sebagai kategori transaksi biasa)"),
    notes: z.string().optional().describe("Catatan/konteks tambahan jika ada"),
    isDebt: z.boolean().default(false).describe("Apakah ini transaksi utang atau piutang? (e.g. 'Pinjam 50rb', 'Bayarin makan teman')"),
    debtorName: z.string().optional().describe("Nama orang yang berurusan (jika ini utang/piutang)"),
});

export type ParsedTransaction = z.infer<typeof TransactionSchema>;

export class AIService {
    private static readonly model = google('gemini-2.5-flash');

    /**
     * Parse input natural language (teks) menjadi objek Transaksi JSON terstruktur.
     */
    static async parseTextToTransaction(message: string): Promise<ParsedTransaction> {
        const { object } = await generateObject({
            model: this.model,
            schema: TransactionSchema,
            system: `Kamu adalah asisten keuangan pribadi yang sangat akurat. 
Tugasmu adalah menyari maksud pengguna, lalu mengekstrak data dari input laporan pengeluaran/pemasukan tersebut ke format yang seragam.
Catatan:
- Pastikan ekstraksi 'amount' berbentuk angka bulat, contoh "50k" -> 50000.
- Deteksi Utang/Piutang: Jika pengguna menyebutkan "pinjam", "ngutang", "bayarin [nama]", "dipinjem [nama]", set isDebt: true dan ekstrak debtorName.
- Pahami konteks pengguna. Contoh: "Beli starbucks 50rb" -> EXPENSE, kategori: LIFESTYLE. "Bayar kos 2jt" -> EXPENSE, kategori: ESSENTIAL.
- Gunakan PROJECT hanya untuk transaksi proyek/bisnis/freelance. PROJECT bukan fitur project tracking, hanya kategori biasa.
- Jangan pernah salah mengklasifikasikan LIFESTYLE vs ESSENTIAL.`,
            prompt: `Ekstrak transaksi dari pesan ini: "${message}"`,
        });

        return object;
    }

    /**
     * Memberikan feedback sarkas berdasarkan sisa budget lifestyle.
     */
    static async generateSarcasticFeedback(
        transactionTitle: string,
        amount: number,
        category: string,
        budgetRemaining: number
    ): Promise<string> {
        const { text } = await generateText({
            model: this.model,
            system: `Kamu adalah asisten keuangan yang sangat sarkas, bermulut tajam, tapi sebenarnya peduli (tsundere). 
Bahasa: Indonesia Gaul/Jaksel.
Konteks: Jika pengguna menghabiskan uang untuk LIFESTYLE saat budget menipis, ejek mereka dengan kejam tapi lucu. 
Jika budget esensial, tetap ingatkan tapi jangan terlalu kejam.
Jangan memberikan nasihat finansial yang membosankan. Gunakan analogi kemiskinan yang kocak.`,
            prompt: `Transaksi Baru: "${transactionTitle}" seharga Rp${amount.toLocaleString()}. 
Kategori: ${category}. 
Sisa Budget Kategori Ini: Rp${budgetRemaining.toLocaleString()}.
Berikan 1 kalimat feedback singkat (max 20 kata).`,
        });

        return text;
    }

    /**
     * Parse image (receipt, bill, etc.) menjadi objek Transaksi JSON terstruktur menggunakan Vision/OCR.
     */
    static async parseImageToTransaction(
        imageData: string | Uint8Array | ArrayBuffer | Buffer,
        mediaType: string = 'image/jpeg'
    ): Promise<ParsedTransaction> {
        const { object } = await generateObject({
            model: this.model,
            schema: TransactionSchema,
            system: `Kamu adalah asisten keuangan pribadi yang sangat akurat dengan kemampuan vision/OCR. 
Tugasmu adalah menganalisis gambar struk, kwitansi, atau bukti transaksi, lalu mengekstrak data ke format yang seragam.
Catatan:
- Fokus pada teks yang terlihat dalam gambar: total amount, merchant name, tanggal, item items.
- Pastikan ekstraksi 'amount' berbentuk angka bulat, contoh "50.000" -> 50000, "Rp 100k" -> 100000.
- Deteksi Utang/Piutang: Jika ada teks "pinjam", "utang", "bayar ke [nama]", "dari [nama]", set isDebt: true dan ekstrak debtorName.
- Pahami konteks: struk supermarket biasanya EXPENSE kategori ESSENTIAL, struk restoran bisa LIFESTYLE atau ESSENTIAL tergantung konteks.
- Gunakan PROJECT hanya untuk transaksi proyek/bisnis/freelance. PROJECT bukan fitur project tracking, hanya kategori biasa.
- Jika tidak bisa mendeteksi dengan pasti, berikan nilai default yang reasonable.`,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Ekstrak transaksi dari gambar struk/kwitansi ini:' },
                        { 
                            type: 'image', 
                            image: imageData,
                            mediaType
                        }
                    ]
                }
            ],
        });

        return object;
    }
}
