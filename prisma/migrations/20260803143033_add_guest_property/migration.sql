/*
  Warnings:

  - Added the required column `propertyId` to the `Guest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "propertyId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Guest_propertyId_idx" ON "Guest"("propertyId");

-- CreateIndex
CREATE INDEX "Guest_phone_idx" ON "Guest"("phone");

-- CreateIndex
CREATE INDEX "Guest_nrcOrPassport_idx" ON "Guest"("nrcOrPassport");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
