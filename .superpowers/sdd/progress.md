# Migration progress ledger

Base: c97abfd

Task 1: complete (commit 03b7026 + fixup, pnpm migration, review clean)
  - Review found: npm invocation left in package.json lint script (fixed)
  - Docker build UNVERIFIED: Docker not installed in this environment
  - Minor deferred: Dockerfile does not split COPY for layer caching (revisit at Task 13 rewrite)
Task 2: next
