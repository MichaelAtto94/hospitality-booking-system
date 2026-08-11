CREATE TABLE IF NOT EXISTS "PasswordResetCode" (
 "id" TEXT NOT NULL,"email" TEXT NOT NULL,"codeHash" TEXT NOT NULL,
 "resetTokenHash" TEXT,"expiresAt" TIMESTAMP(3) NOT NULL,
 "attempts" INTEGER NOT NULL DEFAULT 0,"verifiedAt" TIMESTAMP(3),
 "usedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PasswordResetCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PasswordResetCode_email_createdAt_idx" ON "PasswordResetCode"("email","createdAt");
CREATE INDEX IF NOT EXISTS "PasswordResetCode_resetTokenHash_idx" ON "PasswordResetCode"("resetTokenHash");