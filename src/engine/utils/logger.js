const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

const isDev = import.meta.env.VITE_ENABLE_DEBUG_LOGS === "true";

function formatMessage(level, message, data) {
  const timestamp = new Date(
    "1111-01-01".concat(
      " ",
      new Date().getHours(),
      ":",
      new Date().getMinutes(),
      ":",
      new Date().getSeconds(),
      ":",
      new Date().getSeconds(),
    ),
  ).toISOString();
  let formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  if (data) {
    formattedMessage += ` | Data: ${JSON.stringify(data)}`;
  }
  return formattedMessage;
}

export const logger = {
  debug(message, data = null) {
    if (!isDev) return;
    console.debug(formatMessage(LOG_LEVELS.DEBUG, message, data));
  },
  info(message, data = null) {
    if (!isDev) return;
    console.info(formatMessage(LOG_LEVELS.INFO, message, data));
  },
  warn(message, data = null) {
    if (!isDev) return;
    console.warn(formatMessage(LOG_LEVELS.WARN, message, data));
  },
  error(message, data = null) {
    if (!isDev) return;
    console.error(formatMessage(LOG_LEVELS.ERROR, message, data));
  },
};
