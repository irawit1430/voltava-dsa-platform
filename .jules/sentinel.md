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
## 2024-07-23 - Unauthenticated AI Script Generation
**Vulnerability:** The `/api/gemini/generate/route.ts` endpoint allowed unauthenticated users to trigger calls to the Gemini LLM API, resulting in a potential Denial of Wallet or abuse of application resources.
**Learning:** API routes invoking expensive third-party APIs were not protected by default in this application's Next.js setup.
**Prevention:** Always require authentication on API endpoints that consume cloud provider resources (like LLMs). When `firebase-admin` is absent, explicitly enforce authentication using the Google Identity Toolkit REST API for token verification.
