// src/logger.js

const LEVELS = ['debug', 'info', 'warn', 'error', 'none'];
let currentLevel = 'info'; // Set the default log level here

function shouldLog(level) {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(currentLevel);
}

const logger = {
  setLevel(level) {
    if (LEVELS.includes(level)) {
      currentLevel = level;
    }
  },
  debug(...args) {
    if (shouldLog('debug')) console.debug('[DEBUG]', ...args);
  },
  info(...args) {
    if (shouldLog('info')) console.info('[INFO]', ...args);
  },
  warn(...args) {
    if (shouldLog('warn')) console.warn('[WARN]', ...args);
  },
  error(...args) {
    if (shouldLog('error')) console.error('[ERROR]', ...args);
  }
};

// Centralize log level here
logger.setLevel(currentLevel);

export default logger;
