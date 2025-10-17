// src/logger.js

const LEVELS = ['debug', 'info', 'warn', 'error', 'none'];
let currentLevel = 'warn'; // Set the default log level here

function shouldLog(level) {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(currentLevel);
}

const APP_NAME = 'YouTube Watch Guard';

const logger = {
  setLevel(level) {
    if (LEVELS.includes(level)) {
      currentLevel = level;
    }
  },
  debug(...args) {
    if (shouldLog('debug')) console.debug(`[DEBUG] ${APP_NAME}:`, ...args);
  },
  info(...args) {
    if (shouldLog('info')) console.info(`[INFO] ${APP_NAME}:`, ...args);
  },
  warn(...args) {
    if (shouldLog('warn')) console.warn(`[WARN] ${APP_NAME}:`, ...args);
  },
  error(...args) {
    if (shouldLog('error')) console.error(`[ERROR] ${APP_NAME}:`, ...args);
  }
};

// Centralize log level here
logger.setLevel(currentLevel);

export default logger;
