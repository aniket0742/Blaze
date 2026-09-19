#!/usr/bin/env node
'use strict';
// UserPromptSubmit hook: appends the verbatim prompt to the session log
// immediately on submission, before the response is known.
const lib = require('./capture-lib');

function main() {
  const raw = lib.readStdin();
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch (e) {
    lib.logError(new Error('capture-prompt: failed to parse stdin JSON: ' + raw));
    return;
  }

  // Skip subagent turns; only the top-level session's prompts are captured.
  if (input.agent_id) return;

  const sessionId = input.session_id || 'unknown-session';
  const prompt = typeof input.prompt === 'string' ? input.prompt : '';
  const transcriptPath = input.transcript_path;
  const nowStr = lib.nowIso();

  let meta = lib.loadMeta(sessionId);
  if (!meta) meta = lib.newMeta(sessionId, nowStr, transcriptPath);

  meta.total_exchanges += 1;
  meta.last_prompt_time = nowStr;
  meta.model = lib.findLastModelFromTranscript(transcriptPath) || meta.model || 'unknown';

  const entry =
    `[LOG_ENTRY type=PROMPT num=${meta.total_exchanges} session=${sessionId}]\n` +
    `timestamp: ${nowStr}\n` +
    `model: ${meta.model}\n\n` +
    `${prompt}\n\n\n`;

  lib.appendBody(sessionId, entry);
  lib.saveMeta(sessionId, meta);
  lib.writeLogFile(meta);
}

try {
  main();
} catch (e) {
  lib.logError(e);
}
process.exit(0);
