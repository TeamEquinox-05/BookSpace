# BookSpace — Bug Report

> **Generated on:** 2026-03-08  
> **Last updated:** 2026-03-08  
> **Scope:** Full backend + frontend codebase audit

---

## All bugs have been fixed.

### Remaining manual action required:

#### BUG-001: Rotate Hardcoded Credentials
- **File:** `backend/src/config/config.env`
- **Status:** Partially addressed — `config.env` is in `.gitignore` and a `config.env.example` is provided. The JWT secret has been replaced with a strong random string.
- **Still needed:** Rotate the MongoDB password and Gmail app password from external dashboards (MongoDB Atlas, Google Account). The current values in `config.env` should be treated as compromised if they were ever committed to git.

---

## Fixes Applied

| ID | Bug | Fix |
|--------|-------|------|
| BUG-001 | Hardcoded creds in config.env | `.gitignore` covers config.env; example file exists. Credentials need external rotation. |
| BUG-002 | Weak JWT secret | Replaced with 128-char hex string in `config.env`. |
| BUG-003 | Token in login response body | Removed; only set as httpOnly cookie. |
| BUG-004 | Token stored in localStorage | Cookie-only auth; localStorage caches user profile only. |
| BUG-005 | Seed script logged password | Removed; only name and email logged. |
| BUG-006 | Default admin credentials | Env vars required with no defaults. |
| BUG-007 | check-email user enumeration | Returns identical response regardless. |
| BUG-008 | Login reveals account state | Generic "Invalid email or password" for failures. |
| BUG-009 | Auth middleware logged tokens | Only logs 'Auth header found'. |
| BUG-010 | CORS allows no origin | Blocks no-origin in production. |
| BUG-011 | Hardcoded ngrok URL | Removed from vite.config.js. |
| BUG-012 | Facility emails exposed | Stripped from public API responses. |
| BUG-013 | Inconsistent password length | Standardized to 8 chars. |
| BUG-014 | Ghost field validation | Removed amenities/cost validation. |
| BUG-015 | Mass assignment in PUT | Whitelist applied. |
| BUG-016 | No booking gap | 30-min buffer enforced. |
| BUG-017 | Pending overlap ignored | Includes approved + pending. |
| BUG-018 | Past booking allowed | Rejects past start times. |
| BUG-019 | No max booking date | 90-day max enforced. |
| BUG-020 | Deprecated Mongoose opts | Removed. |
| BUG-021 | Dual bcrypt libraries | Removed bcryptjs; using bcrypt only. |
| BUG-022 | Unconditional trust proxy | Production-only. |
| BUG-023 | Fragile module.exports | Fixed pattern. |
| BUG-024 | Duplicate axios instances | Single shared instance. |
| BUG-025 | Stale cached data | 1-hour expiry; 401 clears cache. |
| BUG-026 | Playwright in prod deps | Moved to devDependencies. |
| BUG-027 | No CSRF protection | sameSite=lax. |
| BUG-028 | Invalid Route end prop | Removed. |
| BUG-029 | Unscoped calendar state | Scoped by user ID. |
| BUG-030 | Unused role field | Removed. |
