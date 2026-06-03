-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "isAuto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successRows" INTEGER NOT NULL,
    "errorRows" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
