-- CreateTable
CREATE TABLE "EmailTemplateConfig" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "senderName" TEXT NOT NULL DEFAULT 'StockManager',
    "footerText" TEXT NOT NULL DEFAULT 'StockManager Depo Yönetim Sistemi',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "EmailTemplateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplateConfig_templateKey_key" ON "EmailTemplateConfig"("templateKey");
