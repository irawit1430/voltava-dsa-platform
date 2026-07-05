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
## 2026-07-05 - Hardcoded API Key in Firebase Config
**Vulnerability:** A hardcoded `apiKey` for Firebase was present in the `firebase-applet-config.json` configuration file, committing a sensitive credential to the repository.
**Learning:** Checking in configuration files that contain secrets like API keys is a critical vulnerability that can lead to unauthorized access and abuse of associated services.
**Prevention:** Always use environment variables for sensitive configuration values. In Next.js, use `NEXT_PUBLIC_` prefixed environment variables for keys that must be available to the client, but ensure they are not committed to source control. Use `.env.example` to document required variables without exposing their actual values.
