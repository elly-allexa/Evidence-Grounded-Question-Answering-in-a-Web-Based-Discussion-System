-- DropForeignKey
ALTER TABLE "SourceChunk" DROP CONSTRAINT "SourceChunk_docId_fkey";

-- AddForeignKey
ALTER TABLE "SourceChunk" ADD CONSTRAINT "SourceChunk_docId_fkey" FOREIGN KEY ("docId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
