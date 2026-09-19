#!/usr/bin/env node
'use strict';
// Stop hook: appends the final assistant response text for the turn that
// just ended. Fires once per completed turn (after any tool-use loop), so
// only the final visible text is captured -- no thinking, no tool calls.
const lib = require('./capture-lib');

function main() {
  const raw = lib.readStdin();
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch (e) {
    lib.logError(new Error('capture-stop: failed to parse stdin JSON: ' + raw));
    return;
  }

  // Skip subagent turns; only the top-level session's responses are captured.
  if (input.agent_id) return;

  // A Stop hook re-invoked via stop_hook_active means this is a forced
  // continuation, not a fresh turn -- avoid double-logging the same exchange.
  if (input.stop_hook_active) return;

  const sessionId = input.session_id || 'unknown-session';
  const transcriptPath = input.transcript_path;
  const nowStr = lib.nowIso();

  let meta = lib.loadMeta(sessionId);
  if (!meta) {
    // Stop fired without a prior prompt-hook write for this session (e.g.
    // hooks installed mid-session). Create a minimal record so we still
    // capture something rather than silently dropping the response.
    meta = lib.newMeta(sessionId, nowStr, transcriptPath);
    meta.total_exchanges = 1;
  }

  if (meta.last_logged_response_num >= meta.total_exchanges) return;

  let responseText = typeof input.last_assistant_message === 'string' ? input.last_assistant_message : '';
  if (!responseText) responseText = lib.extractLastAssistantText(transcriptPath);

  meta.model = lib.findLastModelFromTranscript(transcriptPath) || meta.model || 'unknown';

  const entry =
    `[LOG_ENTRY type=RESPONSE num=${meta.total_exchanges} session=${sessionId}]\n` +
    `timestamp: ${nowStr}\n` +
    `model: ${meta.model}\n\n` +
    `${responseText}\n\n\n`;

  lib.appendBody(sessionId, entry);
  meta.last_logged_response_num = meta.total_exchanges;
  lib.saveMeta(sessionId, meta);
  lib.writeLogFile(meta);
}

try {
  main();
} catch (e) {
  lib.logError(e);
}
process.exit(0);
