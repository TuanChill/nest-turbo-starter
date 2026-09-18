# Google OAuth email verification fix

- Symptom: `POST /circle/api/auth/google` returned `401 Unauthorized` with `Google account email is not verified`.
- Cause: Google’s access-token metadata uses `email_verified` as a string, while the server parser only accepted the legacy `verified_email` boolean field and rejected the valid account as unverified.
- Change: normalize boolean/string verification claims, support both Google field names, and require an explicit verified userinfo profile.
- Prevention: added regression coverage for string claims, unverified claims, missing profile verification, and identity mismatches.
- Verification: project-service typecheck, build, targeted lint/format, targeted auth tests, and all 5 project-service Jest suites pass. Full project-service lint still reports 16 pre-existing unrelated errors.
- Deployment: production was not reachable from this workspace; deploy the resulting revision through the existing backend deployment process and re-run the Google login flow.
