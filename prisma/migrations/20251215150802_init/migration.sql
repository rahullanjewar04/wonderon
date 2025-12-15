-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diff" JSONB,
    "requestId" TEXT,
    "ip" TEXT,
    "actorId" TEXT,
    "master" BOOLEAN NOT NULL,
    CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "actorId", "diff", "entity", "entityId", "id", "ip", "master", "requestId", "timestamp") SELECT "action", "actorId", "diff", "entity", "entityId", "id", "ip", "master", "requestId", "timestamp" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
