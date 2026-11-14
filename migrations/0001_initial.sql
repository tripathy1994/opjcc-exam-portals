PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS principals(uid TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('teacher','student')), enabled INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS documents(collection TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL CHECK(json_valid(body)), version INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(collection,id));
CREATE INDEX IF NOT EXISTS documents_teacher ON documents(collection,json_extract(body,'$.teacherId'));
CREATE INDEX IF NOT EXISTS documents_student ON documents(collection,json_extract(body,'$.studentId'));
CREATE INDEX IF NOT EXISTS documents_class ON documents(collection,json_extract(body,'$.classId'));
CREATE TABLE IF NOT EXISTS commit_guards(id TEXT PRIMARY KEY, valid INTEGER NOT NULL CHECK(valid=1));
CREATE TABLE IF NOT EXISTS audit_events(id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, event TEXT NOT NULL, target TEXT NOT NULL, at_ms INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS answer_operations(attempt_id TEXT NOT NULL, operation_id TEXT NOT NULL, question_id TEXT NOT NULL, fingerprint TEXT NOT NULL, revision INTEGER NOT NULL, at_ms INTEGER NOT NULL, PRIMARY KEY(attempt_id,operation_id));
CREATE TABLE IF NOT EXISTS publication_revisions(attempt_id TEXT NOT NULL, revision INTEGER NOT NULL, checksum TEXT NOT NULL, payload TEXT NOT NULL, at_ms INTEGER NOT NULL, PRIMARY KEY(attempt_id,revision));
CREATE TABLE IF NOT EXISTS sync_outbox(id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, checksum TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'disabled', UNIQUE(attempt_id,revision));
CREATE TABLE IF NOT EXISTS sync_receipts(event_id TEXT PRIMARY KEY, checksum TEXT NOT NULL, destination TEXT NOT NULL, at_ms INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS paper_versions(exam_id TEXT NOT NULL, content_hash TEXT NOT NULL, public_paper TEXT NOT NULL, at_ms INTEGER NOT NULL, PRIMARY KEY(exam_id,content_hash));
CREATE TABLE IF NOT EXISTS command_history(id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, actor TEXT NOT NULL, detail TEXT NOT NULL, at_ms INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS warning_history(id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, actor TEXT NOT NULL, detail TEXT NOT NULL, at_ms INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS teacher_command_receipts(id TEXT PRIMARY KEY, actor TEXT NOT NULL, attempt_id TEXT NOT NULL, fingerprint TEXT NOT NULL, result TEXT NOT NULL, at_ms INTEGER NOT NULL);
-- Question banks, immutable paper versions, eligibility, attempts, warnings, commands,
-- reviews and minimal master snapshots are versioned documents. No binary media in D1.
