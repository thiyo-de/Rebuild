# E2E Test Infra: REBUILD

## Test Philosophy
- Opaque-box, requirement-driven testing. Validates exact contract specifications derived directly from ORIGINAL_REQUEST.md.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workloads.
- Execution Environment: Node/Vitest / TypeScript test runner verifying:
  1. Offline storage operations & JSON serialization/deserialization integrity.
  2. Scoring engine precision, threshold triggers, and recovery mode rules.
  3. Goals CRUD, active/paused status filtering, and blueprint bundle generation.
  4. Reward unlocking invariants (weekly >=90% & >=3d, monthly >=90% & >=10d).
  5. Metacognitive mirror biological root-cause mappings and Huberman laws integrity.
  6. Zero-italics AST / regex code scanner across all project files.
  7. Icon and local font asset offline availability.

## Feature Inventory & Test Coverage Goals
| # | Feature | Requirement | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Real-World) |
|---|---------|-------------|:----------------:|:-----------------:|:-----------------:|:-------------------:|
| 1 | Offline Local Persistence | R1 | 5 | 5 | ✓ | ✓ |
| 2 | JSON Backup & Full Entity Restore | R1 | 5 | 5 | ✓ | ✓ |
| 3 | Zero Cloud & Google Elimination | R2 | 5 | 5 | ✓ | ✓ |
| 4 | 7-Screen & 4+1 Mobile Navigation | R3 | 5 | 5 | ✓ | ✓ |
| 5 | Daily Execution Loop & Status Colors | R4 | 5 | 5 | ✓ | ✓ |
| 6 | 15 Failure Reasons & Recovery Mode | R4 | 5 | 5 | ✓ | ✓ |
| 7 | Goals CRUD & Paused Score Exclusion | R5 | 5 | 5 | ✓ | ✓ |
| 8 | 4 Starter Blueprints Bundling | R5 | 5 | 5 | ✓ | ✓ |
| 9 | Scoring Engine (Daily/Weekly/Monthly) | R6 | 5 | 5 | ✓ | ✓ |
| 10 | 2027 Milestones Vault Confirmation | R6 | 5 | 5 | ✓ | ✓ |
| 11 | Visual Analysis & Neuroscience Mirror | R7 | 5 | 5 | ✓ | ✓ |
| 12 | Universal Satoshi & Zero Italics | R8 | 5 | 5 | ✓ | ✓ |
| 13 | Local Remixicon Icon Bundling | R9 | 5 | 5 | ✓ | ✓ |
| 14 | Mobile Ergonomics & Capacitor Plugins | R10 | 5 | 5 | ✓ | ✓ |

## Minimum Thresholds
- Tier 1: >=70 test cases (5 per feature area)
- Tier 2: >=70 test cases (boundary & error cases)
- Tier 3: >=14 test cases (pairwise cross-feature interactions)
- Tier 4: >=7 application workload scenarios
- Total Target: >=160 verified assertions across test suite.

## Test Runner Architecture
- Runner command: `npx vitest run` or equivalent verified test script.
- Suite location: `src/__tests__/` or `tests/e2e/`.
- Signal upon completion: Publish `TEST_READY.md` at project root.
