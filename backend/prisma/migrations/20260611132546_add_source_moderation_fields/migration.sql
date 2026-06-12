-- AlterTable
ALTER TABLE "SourceDocument" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedByAdminId" TEXT,
ADD COLUMN     "deletionReason" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
