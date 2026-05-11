-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IDR',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
