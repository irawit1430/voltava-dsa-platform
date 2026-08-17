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
## 2025-02-14 - Missing Authentication on Sensitive API Endpoint
**Vulnerability:** The `/api/gemini/generate` endpoint, which uses a costly third-party AI API, was completely unauthenticated. Anyone could send a POST request to it and drain the API quota.
**Learning:** Relying only on client-side UI to hide functionality doesn't protect the backend API.
**Prevention:** Always verify authentication tokens on the server for sensitive endpoints. When `firebase-admin` is not available, the Google Identity Toolkit REST API (`accounts:lookup`) can be used to verify client ID tokens.
## 2025-02-14 - Missing Input Length Limits on LLM API
**Vulnerability:** The `/api/gemini/generate` endpoint accepted user inputs without length validation, which could be exploited to send massive payloads to the Gemini API, risking denial of service and excessive billing.
**Learning:** Always enforce length constraints on data forwarded to third-party paid APIs.
**Prevention:** Implement strict length and type validations using native JavaScript before processing or forwarding API requests.
