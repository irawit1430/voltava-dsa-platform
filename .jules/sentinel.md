## 2026-07-26 - Missing API Route Authentication
**Vulnerability:** The `/api/gemini/generate/route.ts` endpoint was unauthenticated, allowing any user to generate scripts and potentially exhaust API quotas or abuse the service.
**Learning:** Next.js API routes do not automatically inherit Firebase client-side authentication. Because `firebase-admin` is not used, tokens must be passed manually from the client and verified against the Google Identity Toolkit REST API on the server.
**Prevention:** Always verify authentication for sensitive or resource-intensive API routes. Extract the `Authorization` header and validate the ID token using the Identity Toolkit API before processing requests.

## 2024-06-17 - Error Information Leakage via API Response
**Vulnerability:** The `/api/gemini/generate/route.ts` endpoint leaks detailed internal error messages to the client when a failure occurs. This can expose stack traces, internal paths, or API configuration details.
**Learning:** Sending `error: error.message` in the catch block of API routes leaks internal error details to the frontend.
**Prevention:** In production/client-facing API responses, log the detailed error internally and return a generic error message (e.g., "Failed to generate script" or "Internal Server Error").
## 2024-05-24 - [Fix PII Leakage in Error Logs]
**Vulnerability:** User PII (email, emailVerified) was being included in `handleFirestoreError` and logged out to the console and thrown in errors.
**Learning:** Auth objects often contain sensitive user details beyond just identifiers. Indiscriminately dumping the entire or partial auth object in errors causes PII leakage in application logs and potentially client-side error traces.
**Prevention:** Always sanitize auth and user objects before logging them or throwing them in errors. Specifically, explicitly select non-PII fields like `userId` instead of passing along emails or other personal data.
## 2024-06-27 - Arbitrary File Upload in Document Vault
**Vulnerability:** The Document Vault file upload functionality in `components/DocumentVault.tsx` lacked file type and size restrictions. Users could upload any file format (including potentially malicious scripts, executables, or excessively large files) which could lead to Stored XSS, malware hosting, or Denial of Service via storage exhaustion.
**Learning:** React `<input type="file">`, without strict programmatic server/client validation, acts as a vector for multiple critical security risks. The `accept` HTML attribute alone does not provide adequate security as it can be bypassed.
**Prevention:** Always implement programmatic checks on both file type (`file.type`) and file size (`file.size`) inside upload handlers. Furthermore, sanitize filenames to avoid path traversal and use restricted upload policies in cloud storage/firewall rules where possible.
## 2024-07-18 - Hardcoded Firebase API Key
**Vulnerability:** A highly critical Firebase API key was hardcoded directly in `firebase-applet-config.json`.
**Learning:** Hardcoding API keys directly into configuration files that are checked into version control makes them easily accessible to unauthorized individuals.
**Prevention:** Always use environment variables to supply API keys or other sensitive credentials during initialization. Use `NEXT_PUBLIC_FIREBASE_API_KEY` to provide the key to the frontend client securely.
