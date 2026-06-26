## 2024-06-17 - Error Information Leakage via API Response
**Vulnerability:** The `/api/gemini/generate/route.ts` endpoint leaks detailed internal error messages to the client when a failure occurs. This can expose stack traces, internal paths, or API configuration details.
**Learning:** Sending `error: error.message` in the catch block of API routes leaks internal error details to the frontend.
**Prevention:** In production/client-facing API responses, log the detailed error internally and return a generic error message (e.g., "Failed to generate script" or "Internal Server Error").
## 2024-05-24 - [Fix PII Leakage in Error Logs]
**Vulnerability:** User PII (email, emailVerified) was being included in `handleFirestoreError` and logged out to the console and thrown in errors.
**Learning:** Auth objects often contain sensitive user details beyond just identifiers. Indiscriminately dumping the entire or partial auth object in errors causes PII leakage in application logs and potentially client-side error traces.
**Prevention:** Always sanitize auth and user objects before logging them or throwing them in errors. Specifically, explicitly select non-PII fields like `userId` instead of passing along emails or other personal data.
## 2024-06-26 - [Fix Hardcoded Firebase API Key]
**Vulnerability:** The Firebase API key was hardcoded in `firebase-applet-config.json` and committed to the repository, exposing the secret.
**Learning:** Next.js static generation executes code that initializes Firebase during the build process (`npm run build`). When the API key is moved to an environment variable, the build will fail with an 'invalid-api-key' error if the variable is missing, requiring a dummy value for the build to succeed.
**Prevention:** Always use environment variables for sensitive configuration like API keys. Ensure build pipelines supply required environment variables (even dummy ones for static generation) if the codebase initializes clients at module scope.
