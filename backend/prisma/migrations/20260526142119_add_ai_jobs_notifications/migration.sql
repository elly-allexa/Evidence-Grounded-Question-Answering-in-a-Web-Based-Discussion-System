-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- DropIndex
DROP INDEX "Notification_isRead_idx";

-- DropIndex
DROP INDEX "Thread_content_trgm_idx";

-- DropIndex
DROP INDEX "Thread_title_trgm_idx";

-- CreateTable
CREATE TABLE "AiJob" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "status" "AiJobStatus" NOT NULL DEFAULT 'QUEUED',
    "answerId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiJob_userId_idx" ON "AiJob"("userId");

-- CreateIndex
CREATE INDEX "AiJob_threadId_idx" ON "AiJob"("threadId");

-- AddForeignKey
ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
