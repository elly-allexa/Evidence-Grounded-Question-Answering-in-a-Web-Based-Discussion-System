CREATE INDEX "SourceChunk_text_fts_idx"
ON "SourceChunk"
USING GIN (to_tsvector('simple', text));

