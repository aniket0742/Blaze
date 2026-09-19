'use strict';
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOGS_DIR = path.join(REPO_ROOT, '.agent-logs');
const STATE_DIR = path.join(REPO_ROOT, '.claude', '.capture-state');
const ERROR_LOG = path.join(STATE_DIR, 'errors.log');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (e) {
    return '';
  }
}

function logError(err) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.appendFileSync(ERROR_LOG, `[${new Date().toISOString()}] ${err && err.stack ? err.stack : err}\n`);
  } catch (_) {
    // last resort: nothing we can do without risking crashing the hook
  }
}

function nowIso() {
  return new Date().toISOString();
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function fileTimestamp(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}_${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`;
}

function readTranscriptLines(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];
    return fs.readFileSync(transcriptPath, 'utf8').split('\n');
  } catch (e) {
    logError(e);
    return [];
  }
}

// Scans a transcript.jsonl file backwards for the most recent assistant
// entry's model name. Empirically (verified against a real transcript file
// on 2026-09-19), the model lives at message.model, not a top-level field.
function findLastModelFromTranscript(transcriptPath) {
  const lines = readTranscriptLines(transcriptPath);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (_) {
      continue;
    }
    if (!obj) continue;
    const model = (obj.message && obj.message.model) || obj.model;
    if (model) return model;
  }
  return null;
}

// Fallback extraction of the final assistant text for a turn, used only if
// the Stop hook's own last_assistant_message field is missing/empty.
// Concatenates text blocks only; thinking and tool_use blocks are skipped.
function extractLastAssistantText(transcriptPath) {
  const lines = readTranscriptLines(transcriptPath);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (_) {
      continue;
    }
    if (obj && obj.type === 'assistant' && obj.message && Array.isArray(obj.message.content)) {
      const texts = obj.message.content
        .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text);
      if (texts.length) return texts.join('\n\n');
    }
  }
  return '';
}

function gitAuthor() {
  try {
    const { execSync } = require('child_process');
    const name = execSync('git config --get user.name', { cwd: REPO_ROOT }).toString().trim();
    if (name) return name;
  } catch (_) {
    // no git config available; fall through
  }
  return 'unknown';
}

function sessionStateDir(sessionId) {
  return path.join(STATE_DIR, sessionId);
}

function loadMeta(sessionId) {
  const metaPath = path.join(sessionStateDir(sessionId), 'meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (e) {
      logError(e);
    }
  }
  return null;
}

function saveMeta(sessionId, meta) {
  const dir = sessionStateDir(sessionId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
}

function appendBody(sessionId, text) {
  const dir = sessionStateDir(sessionId);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, 'body.md'), text);
}

function readBody(sessionId) {
  const p = path.join(sessionStateDir(sessionId), 'body.md');
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  return '';
}

function projectName() {
  return path.basename(REPO_ROOT);
}

function newMeta(sessionId, nowStr, transcriptPath) {
  const now = new Date(nowStr);
  return {
    session_id: sessionId,
    date: nowStr.slice(0, 10),
    author: gitAuthor(),
    model: findLastModelFromTranscript(transcriptPath) || 'unknown',
    tool: 'claude-code',
    project: projectName(),
    total_exchanges: 0,
    first_prompt_time: nowStr,
    last_prompt_time: nowStr,
    last_logged_response_num: 0,
    log_file: `${fileTimestamp(now)}_${sessionId}.md`,
  };
}

function writeLogFile(meta) {
  const frontmatter = [
    '---',
    `session_id: ${meta.session_id}`,
    `date: ${meta.date}`,
    `author: ${meta.author}`,
    `model: ${meta.model || 'unknown'}`,
    `tool: ${meta.tool}`,
    `project: ${meta.project}`,
    `total_exchanges: ${meta.total_exchanges}`,
    `first_prompt_time: ${meta.first_prompt_time}`,
    `last_prompt_time: ${meta.last_prompt_time}`,
    '---',
    '',
    `# Session Log - ${meta.date}`,
    '',
    `Session: \`${meta.session_id.slice(0, 8)}\` | Project: \`${meta.project}\` | Author: \`${meta.author}\``,
    '',
    '---',
    '',
    '',
  ].join('\n');
  const body = readBody(meta.session_id);
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOGS_DIR, meta.log_file), frontmatter + body);
}

module.exports = {
  REPO_ROOT,
  LOGS_DIR,
  STATE_DIR,
  readStdin,
  logError,
  nowIso,
  findLastModelFromTranscript,
  extractLastAssistantText,
  gitAuthor,
  loadMeta,
  saveMeta,
  appendBody,
  readBody,
  projectName,
  newMeta,
  writeLogFile,
};
