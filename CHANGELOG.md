# Changelog

## March 3, 2026

### Added
- Added `.gitattributes` to enforce LF line endings for source and documentation files.
- Added repository changelog tracking in `CHANGELOG.md`.
- Added automated regression guard `scripts/verify-decoupling.js`.
- Added npm script `verify:decoupling` and integrated it into `test:all`.
- Added npm script `verify:deployment` for full deployment contract checks.

### Changed
- Completed backend Base44 decoupling: all Deno functions now use shared helper `getBase44Client(req)` from `functions/_shared/base44Client.ts`.
- Confirmed frontend Base44 access remains centralized through `src/api/backendClient.js`.
- Updated `scripts/verify-deployment.js` to execute decoupling verification during pre-deployment validation.
- Enforced decoupling verification in CI workflows (`.github/workflows/test.yml`, `.github/workflows/deploy-training-accounts.yml`).
- Enforced deployment contract verification in CI test workflow (`.github/workflows/test.yml`).
- Tightened CI/deploy behavior to fail-fast for core quality, test, and deployment steps.
- Standardized markdown metadata dates and refreshed deployment/verification documentation to March 3, 2026.

### Validation
- Decoupling verification passes: `npm run verify:decoupling`.
- Unit tests pass: `npm run test` (25/25).
- Integration tests pass: `npm run test:integration` (18/18).

### Notable Commits
- `c2bad47` Adopt shared Base44 client in task assignment backend functions
- `7a2c77b` Adopt shared Base44 client in AI and rewards backend functions
- `ffd764e` Adopt shared Base44 client in analytics and admin backend functions
- `2ae88bc` Adopt shared Base44 client in proactive and product backend functions
- `fe558d6` Adopt shared Base44 client in remaining backend functions
- `38bf778` Add automated Base44 decoupling verification guard
- `995d12b` Enforce decoupling guard in deployment verification
- `96ad54a` Enforce decoupling verification in CI workflows
- `5d004e2` Make CI quality gates strictly blocking
- `c7c6fcf` Make deployment function steps fail-fast in CI
- `a04ae46` Update CI/CD guide for decoupling guard and strict gates
- `00b1b45` Add deployment verification gate to CI
