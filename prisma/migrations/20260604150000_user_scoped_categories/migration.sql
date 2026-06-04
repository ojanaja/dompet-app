ALTER TABLE "Category" ADD COLUMN "userId" TEXT;

DROP INDEX IF EXISTS "Category_name_key";

INSERT INTO "Category" ("id", "userId", "name", "type", "createdAt", "updatedAt")
SELECT
  'cat_' || md5("User"."id" || ':' || legacy."id"),
  "User"."id",
  legacy."name",
  legacy."type",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
CROSS JOIN "Category" legacy
WHERE legacy."userId" IS NULL;

UPDATE "Transaction"
SET "categoryId" = 'cat_' || md5("Transaction"."userId" || ':' || "Transaction"."categoryId")
WHERE "categoryId" IN (
  SELECT "id" FROM "Category" WHERE "userId" IS NULL
);

UPDATE "Budget"
SET "categoryId" = 'cat_' || md5("Budget"."userId" || ':' || "Budget"."categoryId")
WHERE "categoryId" IN (
  SELECT "id" FROM "Category" WHERE "userId" IS NULL
);

UPDATE "RecurringTransaction"
SET "categoryId" = 'cat_' || md5("RecurringTransaction"."userId" || ':' || "RecurringTransaction"."categoryId")
WHERE "categoryId" IN (
  SELECT "id" FROM "Category" WHERE "userId" IS NULL
);

DELETE FROM "Category" WHERE "userId" IS NULL;

ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;

CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
