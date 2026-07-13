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
## 2024-07-13 - Hardcoded Firebase API Key in Config
**Vulnerability:** A hardcoded Firebase API key was found in `firebase-applet-config.json` and committed to the codebase.
**Learning:** Hardcoding API keys in static JSON configurations exposes secrets to version control and anyone with access to the source code. The pattern `firebaseConfig = require('firebase-applet-config.json')` bypassed environment variable safety.
**Prevention:** Use environment variables (like `NEXT_PUBLIC_FIREBASE_API_KEY`) to inject secrets at build/runtime. When loading config from JSON files, merge environment variables dynamically over the static JSON template in the application initialization logic (e.g., `lib/firebase.ts`).
