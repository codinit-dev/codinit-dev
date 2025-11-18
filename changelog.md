# Changelog

## [1.0.9] - 2025-01-18

### New Features

- **Cloudflare Pages Deployment**: Added Cloudflare Pages deployment integration with local SVG icons
- **Settings Dropdown**: Added settings dropdown functionality to PreviewHeader

### UI/UX Improvements

- **Dark Mode**: Updated colors and fixed dark mode errors
- **Preview Header**: Updated preview header with standardized button sizes and layout
- **Button Styling**: Unified button styling across components with consistent w-8 h-8 sizing
- **Icons**: Updated deployment icons to use local SVG assets and standardized icon usage
- **Code Mode Header**: Removed terminal button and updated layout

### Bug Fixes

- **Update API**: Fixed handling of 429 HTTP status codes for rate limiting in the update check API route
- **Client-side Updates**: Improved client-side update checking to properly parse API responses and handle rate limiting errors
- **Code Quality**: Fixed ESLint linting error in the useUpdateCheck hook
- **IconButton**: Fixed border centering issues in IconButton component

### Technical Details

- Modified `app/routes/api.update.ts` to handle both 403 and 429 status codes as rate limiting
- Updated `app/lib/api/updates.ts` to parse JSON responses before checking HTTP status and recognize 429 as rate limiting
- Fixed formatting issue in `app/lib/hooks/useUpdateCheck.ts` to comply with ESLint rules
- Updated deployment icons to use local SVG assets instead of external sources
- Standardized button sizes and layouts across PreviewHeader and related components

### Impact

These changes resolve the "API request failed: 429" error that users were experiencing when GitHub's API rate limiting returned a 429 status code instead of the expected 403. The UI improvements provide a more consistent and polished user experience with better dark mode support and standardized component styling.