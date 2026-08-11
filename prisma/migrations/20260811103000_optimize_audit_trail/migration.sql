CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx"
ON "AuditLog"("action", "createdAt");

CREATE INDEX IF NOT EXISTS "AuditLog_entity_createdAt_idx"
ON "AuditLog"("entity", "createdAt");

CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx"
ON "AuditLog"("userId", "createdAt");