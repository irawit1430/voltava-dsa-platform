## 2024-06-17 - Error Information Leakage via API Response
**Vulnerability:** The `/api/gemini/generate/route.ts` endpoint leaks detailed internal error messages to the client when a failure occurs. This can expose stack traces, internal paths, or API configuration details.
**Learning:** Sending `error: error.message` in the catch block of API routes leaks internal error details to the frontend.
**Prevention:** In production/client-facing API responses, log the detailed error internally and return a generic error message (e.g., "Failed to generate script" or "Internal Server Error").
## 2024-05-24 - [Fix PII Leakage in Error Logs]
**Vulnerability:** User PII (email, emailVerified) was being included in `handleFirestoreError` and logged out to the console and thrown in errors.
**Learning:** Auth objects often contain sensitive user details beyond just identifiers. Indiscriminately dumping the entire or partial auth object in errors causes PII leakage in application logs and potentially client-side error traces.
**Prevention:** Always sanitize auth and user objects before logging them or throwing them in errors. Specifically, explicitly select non-PII fields like `userId` instead of passing along emails or other personal data.
## 2026-06-21 - [Prevent Sensitive Data Leakage in UI via Error Responses]
**Vulnerability:** The `handleFirestoreError` utility in `lib/db.ts` was taking detailed error logs—including user IDs, internal database paths, and raw internal error strings—and directly throwing them. These serialized JSON error details were being displayed to users on the UI in `alert()` calls.
**Learning:** Returning detailed serialized internal error logs out to the UI leaks sensitive paths and user identifiers to clients. Internal error context should not be directly thrown or surfaced to user-facing error prompts.
**Prevention:** Decouple internal error logging from client-facing error messages. Log detailed error payloads to the server or internal console, but throw sanitized, generic errors (e.g., "An error occurred while communicating with the database.") for client consumption.
