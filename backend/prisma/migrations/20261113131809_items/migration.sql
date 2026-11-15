-- CreateEnum
CREATE TYPE "ItemSource" AS ENUM ('direct', 'point');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('published', 'reserved', 'transferred', 'hidden', 'rejected');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('brand_new', 'excellent', 'good', 'fair');

-- CreateEnum
CREATE TYPE "TransferFormat" AS ENUM ('gift', 'exchange');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('requested', 'negotiating', 'awaiting_handover', 'awaiting_receiver_confirmation', 'completed', 'cancelled', 'in_review');

-- CreateEnum
CREATE TYPE "CancelReason" AS ENUM ('changed_mind', 'no_response', 'item_unavailable', 'no_show', 'other');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('text', 'system');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('prohibited_item', 'fake_or_scam', 'offensive', 'spam', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "PointsCurrency" AS ENUM ('points', 'dobro');

-- CreateEnum
CREATE TYPE "PointsReason" AS ENUM ('p2p_give', 'p2p_receive', 'drop_off', 'pickup', 'volunteer_shift', 'reward', 'adjustment', 'refund');

-- CreateEnum
CREATE TYPE "WeightSource" AS ENUM ('actual', 'estimated');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('deal_requested', 'new_message', 'deal_status_changed', 'review_received', 'points_changed');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dobroPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isTest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examples" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoCoefficient" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "avgMassKg" DOUBLE PRECISION,
    "co2PerKg" DOUBLE PRECISION NOT NULL,
    "version" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcoCoefficient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "source" "ItemSource" NOT NULL DEFAULT 'direct',
    "status" "ItemStatus" NOT NULL DEFAULT 'published',
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "condition" "ItemCondition" NOT NULL,
    "transferFormat" "TransferFormat" NOT NULL,
    "wantedInReturn" VARCHAR(300),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weightKg" DOUBLE PRECISION,
    "districtId" INTEGER NOT NULL,
    "meetingNote" VARCHAR(300),
    "moderationNote" VARCHAR(500),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPhoto" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "giverId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'requested',
    "meetingAt" TIMESTAMP(3),
    "meetingNote" VARCHAR(300),
    "handedOverAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" INTEGER,
    "cancelReason" "CancelReason",
    "cancelComment" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "senderId" INTEGER,
    "kind" "MessageKind" NOT NULL DEFAULT 'text',
    "body" VARCHAR(2000) NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" VARCHAR(1000),
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "dealId" INTEGER,
    "reason" "ReportReason" NOT NULL,
    "comment" VARCHAR(1000),
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "resolution" VARCHAR(1000),
    "resolvedById" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" "PointsCurrency" NOT NULL DEFAULT 'points',
    "amount" INTEGER NOT NULL,
    "reason" "PointsReason" NOT NULL,
    "operationKey" TEXT NOT NULL,
    "dealId" INTEGER,
    "createdById" INTEGER,
    "comment" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoRecord" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "coefficientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "massKg" DOUBLE PRECISION NOT NULL,
    "massSource" "WeightSource" NOT NULL,
    "co2eKg" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcoRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "dealId" INTEGER,
    "itemId" INTEGER,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_cityId_name_key" ON "District"("cityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "EcoCoefficient_categoryId_validFrom_idx" ON "EcoCoefficient"("categoryId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "EcoCoefficient_categoryId_version_key" ON "EcoCoefficient"("categoryId", "version");

-- CreateIndex
CREATE INDEX "Item_status_categoryId_idx" ON "Item"("status", "categoryId");

-- CreateIndex
CREATE INDEX "Item_status_publishedAt_idx" ON "Item"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Item_districtId_status_idx" ON "Item"("districtId", "status");

-- CreateIndex
CREATE INDEX "Item_ownerId_idx" ON "Item"("ownerId");

-- CreateIndex
CREATE INDEX "ItemPhoto_itemId_position_idx" ON "ItemPhoto"("itemId", "position");

-- CreateIndex
CREATE INDEX "Deal_itemId_status_idx" ON "Deal"("itemId", "status");

-- CreateIndex
CREATE INDEX "Deal_giverId_status_idx" ON "Deal"("giverId", "status");

-- CreateIndex
CREATE INDEX "Deal_receiverId_status_idx" ON "Deal"("receiverId", "status");

-- CreateIndex
CREATE INDEX "Message_dealId_createdAt_idx" ON "Message"("dealId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_targetId_idx" ON "Review"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_dealId_authorId_key" ON "Review"("dealId", "authorId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_itemId_idx" ON "Report"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "PointsEntry_operationKey_key" ON "PointsEntry"("operationKey");

-- CreateIndex
CREATE INDEX "PointsEntry_userId_createdAt_idx" ON "PointsEntry"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EcoRecord_dealId_key" ON "EcoRecord"("dealId");

-- CreateIndex
CREATE INDEX "EcoRecord_userId_idx" ON "EcoRecord"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoCoefficient" ADD CONSTRAINT "EcoCoefficient_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPhoto" ADD CONSTRAINT "ItemPhoto_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsEntry" ADD CONSTRAINT "PointsEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsEntry" ADD CONSTRAINT "PointsEntry_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsEntry" ADD CONSTRAINT "PointsEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoRecord" ADD CONSTRAINT "EcoRecord_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoRecord" ADD CONSTRAINT "EcoRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoRecord" ADD CONSTRAINT "EcoRecord_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoRecord" ADD CONSTRAINT "EcoRecord_coefficientId_fkey" FOREIGN KEY ("coefficientId") REFERENCES "EcoCoefficient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ограничения, которые Prisma не умеет описывать в schema.prisma.

-- Баланс не может стать отрицательным (AC-PTS-03, FR-PTS-04)
ALTER TABLE "User" ADD CONSTRAINT "user_balances_non_negative" CHECK ("points" >= 0 AND "dobroPoints" >= 0);

-- Оценка отзыва 1..5
ALTER TABLE "Review" ADD CONSTRAINT "review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

-- Количество вещей и вес
ALTER TABLE "Item" ADD CONSTRAINT "item_quantity_positive" CHECK ("quantity" >= 1);
ALTER TABLE "Item" ADD CONSTRAINT "item_weight_positive" CHECK ("weightKg" IS NULL OR "weightKg" > 0);

-- Один получатель — один незавершённый запрос на вещь (защита от дублей и гонок)
CREATE UNIQUE INDEX "deal_one_open_request_per_receiver" ON "Deal" ("itemId", "receiverId")
  WHERE "status" IN ('requested', 'negotiating', 'awaiting_handover', 'awaiting_receiver_confirmation', 'in_review');

-- Вещь можно «договорить» только с одним получателем одновременно (резерв)
CREATE UNIQUE INDEX "deal_one_reservation_per_item" ON "Deal" ("itemId")
  WHERE "status" IN ('awaiting_handover', 'awaiting_receiver_confirmation');
