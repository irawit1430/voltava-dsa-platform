## 2024-06-17 - Error Information Leakage via API Response
**Vulnerability:** The `/api/gemini/generate/route.ts` endpoint leaks detailed internal error messages to the client when a failure occurs. This can expose stack traces, internal paths, or API configuration details.
**Learning:** Sending `error: error.message` in the catch block of API routes leaks internal error details to the frontend.
**Prevention:** In production/client-facing API responses, log the detailed error internally and return a generic error message (e.g., "Failed to generate script" or "Internal Server Error").

## 2025-02-18 - Unauthenticated AI Script Generation Endpoint
**Vulnerability:** The `/api/gemini/generate/route.ts` API route lacked authentication, allowing any user to generate scripts by directly calling the endpoint and using the server's GEMINI_API_KEY.
**Learning:** Next.js App Router API routes must manually verify authentication, even if the application uses Firebase client-side authentication.
**Prevention:** Always verify requests by requiring an `Authorization` header on API routes and using `firebase-admin` to verify the Firebase ID token before executing sensitive logic or consuming API quotas.
