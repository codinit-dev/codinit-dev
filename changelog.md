# Changelog

## [1.0.9] - 2025-01-18

### Bug Fixes

- **Update API**: Fixed handling of 429 HTTP status codes for rate limiting in the update check API route
- **Client-side Updates**: Improved client-side update checking to properly parse API responses and handle rate limiting errors
- **Code Quality**: Fixed ESLint linting error in the useUpdateCheck hook

### Technical Details

- Modified `app/routes/api.update.ts` to handle both 403 and 429 status codes as rate limiting
- Updated `app/lib/api/updates.ts` to parse JSON responses before checking HTTP status and recognize 429 as rate limiting
- Fixed formatting issue in `app/lib/hooks/useUpdateCheck.ts` to comply with ESLint rules

### Impact

These changes resolve the "API request failed: 429" error that users were experiencing when GitHub's API rate limiting returned a 429 status code instead of the expected 403.