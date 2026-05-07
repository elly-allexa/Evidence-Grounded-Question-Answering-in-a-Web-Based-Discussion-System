DROP INDEX IF EXISTS "SourceChunk_text_fts_idx";

CREATE INDEX "SourceChunk_text_fts_idx"
ON "SourceChunk"
USING GIN (to_tsvector('english', text));
