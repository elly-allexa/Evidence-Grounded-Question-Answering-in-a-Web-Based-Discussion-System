CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Thread_title_trgm_idx"
ON "Thread" USING gin ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Thread_content_trgm_idx"
ON "Thread" USING gin ("content" gin_trgm_ops);