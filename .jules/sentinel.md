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
## 2024-08-16 - Unauthenticated API Route consuming paid resources
**Vulnerability:** The `/api/gemini/generate/route.ts` API route lacked authentication, allowing anyone to consume the Gemini API key (Denial of Wallet).
**Learning:** By default, Next.js API routes are public. When using Firebase Auth (without the Admin SDK) it is important to manually verify tokens on the server for sensitive endpoints.
**Prevention:** Always extract and verify the Firebase `Authorization: Bearer <token>` in API route handlers using the Identity Toolkit REST API (`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=...`) or `firebase-admin` before fulfilling sensitive requests.
