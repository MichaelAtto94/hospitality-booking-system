CREATE TYPE "DailyCloseStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REOPENED');

ALTER TABLE "Payment" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "Expense" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

CREATE TABLE "DailyClose" (
    "id" TEXT NOT NULL,
    "businessDate" DATE NOT NULL,
    "status" "DailyCloseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "cashAmount" DECIMAL(14,2) NOT NULL,
    "cardAmount" DECIMAL(14,2) NOT NULL,
    "bankTransferAmount" DECIMAL(14,2) NOT NULL,
    "mtnAmount" DECIMAL(14,2) NOT NULL,
    "airtelAmount" DECIMAL(14,2) NOT NULL,
    "zamtelAmount" DECIMAL(14,2) NOT NULL,
    "refundAmount" DECIMAL(14,2) NOT NULL,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "expenseAmount" DECIMAL(14,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "expectedCash" DECIMAL(14,2) NOT NULL,
    "countedCash" DECIMAL(14,2) NOT NULL,
    "cashVariance" DECIMAL(14,2) NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "preparedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "reopenedById" TEXT,
    "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyClose_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyClose_propertyId_businessDate_key" ON "DailyClose"("propertyId", "businessDate");
CREATE INDEX "DailyClose_propertyId_status_businessDate_idx" ON "DailyClose"("propertyId", "status", "businessDate");

ALTER TABLE "DailyClose" ADD CONSTRAINT "DailyClose_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyClose" ADD CONSTRAINT "DailyClose_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyClose" ADD CONSTRAINT "DailyClose_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DailyClose" ADD CONSTRAINT "DailyClose_reopenedById_fkey" FOREIGN KEY ("reopenedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
