## 2024-06-17 - Error Information Leakage via API Response
**Vulnerability:** The `/api/gemini/generate/route.ts` endpoint leaks detailed internal error messages to the client when a failure occurs. This can expose stack traces, internal paths, or API configuration details.
**Learning:** Sending `error: error.message` in the catch block of API routes leaks internal error details to the frontend.
**Prevention:** In production/client-facing API responses, log the detailed error internally and return a generic error message (e.g., "Failed to generate script" or "Internal Server Error").

## 2024-05-18 - Hardcoded Firebase API Key
**Vulnerability:** A Firebase API key was hardcoded in `firebase-applet-config.json` and committed to the repository.
**Learning:** Hardcoding API keys exposes them to anyone with access to the source code, potentially allowing unauthorized use of the Firebase project resources. It existed because the configuration was directly copied as a JSON file instead of being populated by environment variables.
**Prevention:** Always use environment variables (e.g., `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`) for sensitive credentials and configuration. For static JSON configurations, dynamically merge the sensitive values at runtime using environment variables. Add a `.env.example` file to document required variables without exposing actual values.
