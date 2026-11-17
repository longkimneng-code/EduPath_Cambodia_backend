function sanitize(message) {
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch {
      message = String(message);
    }
  }
  return message
    .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/GEMINI_API_KEY=["']?[^"'\s]+["']?/gi, 'GEMINI_API_KEY=[REDACTED]');
}

function formatLog(level, msg, meta) {
  const timestamp = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length ? ` | ${sanitize(JSON.stringify(meta))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${sanitize(msg)}${metaStr}`;
}

export const logger = {
  info(msg, meta = {}) {
    console.log(formatLog('info', msg, meta));
  },

  warn(msg, meta = {}) {
    console.warn(formatLog('warn', msg, meta));
  },

  error(msg, meta = {}) {
    console.error(formatLog('error', msg, meta));
  },
};
