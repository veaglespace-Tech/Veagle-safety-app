import { config } from '../config/index.js';

let sentryClient = null;

/**
 * Initializes Error Alerting (Sentry SDK if configured, or resilient structured console logger)
 */
export async function initErrorAlerting() {
  const dsn = process.env.SENTRY_DSN || config.sentryDsn;
  if (dsn && typeof dsn === 'string' && dsn.startsWith('http')) {
    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: 0.1,
      });
      sentryClient = Sentry;
      console.log('🛡️ [ErrorAlertService] Sentry error monitoring initialized successfully');
    } catch (err) {
      console.warn('[ErrorAlertService] Sentry module initialization notice:', err.message);
    }
  } else {
    console.log('ℹ️ [ErrorAlertService] Enterprise Structured Error Alerting active (Sentry DSN optional)');
  }
}

/**
 * Reports a critical server error to alerting channels (Sentry / Ops log)
 */
export function reportError(error, context = {}) {
  const timestamp = new Date().toISOString();
  console.error(`🚨 [CRITICAL_SERVER_ERROR] [${timestamp}]`, {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    context,
    stack: error?.stack,
  });

  if (sentryClient) {
    try {
      sentryClient.captureException(error, { extra: context });
    } catch (_) {}
  }
}
