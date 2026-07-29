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
## 2024-07-29 - Missing Authentication on AI Generation API
**Vulnerability:** The `/api/gemini/generate/route.ts` API route lacked any authentication checks, allowing anonymous users to send arbitrary requests to the Gemini API using the server's API key. This could lead to API key exhaustion, excessive billing, and misuse of the AI model.
**Learning:** Next.js API routes are public by default. Relying on frontend UI hiding is insufficient; backend routes must enforce authentication independently. Since `firebase-admin` is not used in this repo, Next.js serverless functions require manual verification of Firebase tokens against the Google Identity Toolkit REST API.
**Prevention:** Always require and verify an authorization token (e.g., Bearer token) on backend API routes. For Firebase projects without the Admin SDK, use the `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=...` REST API with the public API key to validate user ID tokens securely on the server.
