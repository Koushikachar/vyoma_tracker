import * as Sentry from "@sentry/nextjs";
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const S = await import("@sentry/nextjs");
    if (process.env.NEXT_PUBLIC_SENTRY_DSN)
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 0.05,
        environment: process.env.NODE_ENV,
        beforeSend(e) {
          if (e.request) {
            delete e.request.headers;
            delete e.request.cookies;
            delete e.request.data;
            delete e.request.query_string;
          }
          return e;
        },
      }); // no tokens/cookies/payloads
  }
}
