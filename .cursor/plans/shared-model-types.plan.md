---
name: Shared Model Types (packages/shared)
overview: Introduce packages/shared with BaseAttributes/BaseAttributesWithId/Attributes TS pattern for all models; update Sequelize models, services, controllers, and frontend to use shared types.
todos:
  - id: shared-1-pkg
    content: Create packages/shared with common + per-model types
    status: completed
  - id: shared-2-models
    content: Update Sequelize models to extend Model<Attributes, BaseAttributes>
    status: completed
  - id: shared-3-be
    content: Use shared types in repositories, services, controllers/resolvers
    status: completed
  - id: shared-4-fe
    content: Use shared types in frontend (see phase-3-frontend)
    status: completed
isProject: false
---

# Shared Model Types — packages/shared

**Prerequisite for**: Phase 3 Frontend (shared types must exist before FE consumes them).

**Pattern**:

```ts
export interface ModelAttributes {
  id: Id;
  createdAt: string;
  updatedAt: string;
}

export interface UserBaseAttributes { /* create payload */ }
export interface UserBaseAttributesWithId extends UserBaseAttributes { id: Id; }
export interface UserAttributes extends Omit<UserBaseAttributes, "passwordHash">, ModelAttributes {
  availabilities?: AvailabilityAttributes[];
  skills?: SkillAttributes[];
  /* relations for full response */
}
```

---

## Phase 1: Create shared package

1. Add `packages/shared` with `package.json` (`"name": "@shiftsync/shared"`), `tsconfig.json`.
2. Add `packages/shared` to root workspaces.
3. Define `common.ts`: `Id`, `ModelAttributes`, `ModelAttributesWithoutUpdatedAt`.
4. Move enums: `UserRole`, `RequestType`, `RequestStatus`, `AuditAction`, `AuditEntityType`.
5. Define per-model types for all 16 models (BaseAttributes, BaseAttributesWithId, Attributes). Use lite types for circular relations (e.g., `UserLiteAttributes`).

---

## Phase 2: Update Sequelize models

- Each model: `extends Model<XxxAttributes, XxxBaseAttributes>`.
- Import types from `@shiftsync/shared`.

---

## Phase 3: Use shared types in API (services, controllers, resolvers)

**Repositories** (`apps/api/src/database/repositories/`):

- Method params: use `XxxBaseAttributes` for create, `Partial<XxxBaseAttributes>` for update where applicable.
- Return types: keep returning Sequelize instances; callers convert to `XxxAttributes` at boundary if needed.

**Services** (`apps/api/src/*/services/`):

- Input DTOs: align with `XxxBaseAttributes` or use shared types for internal service contracts.
- Return types: document or type as `XxxAttributes` (or `XxxAttributes[]`) when returning data for API responses.
- Example: `UsersService.getProfile()` returns `UserAttributes`; `ShiftsService.create()` accepts `ShiftBaseAttributes`-like input.

**Resolvers / GraphQL**:

- GraphQL ObjectTypes can stay separate for schema; internally map from Sequelize → shared types before returning.
- Use shared types in resolver return type annotations and for input validation shapes where they align with create/update DTOs.

**Controllers** (if any REST endpoints):

- Request body: type as `XxxBaseAttributes` or subset.
- Response: type as `XxxAttributes` or array thereof.

---

## Phase 4: Frontend usage (coordinate with phase-3-frontend)

- Add `@shiftsync/shared` to `apps/web` dependencies.
- Use shared types for:
  - API response typing (fetch, GraphQL client)
  - Form payloads (create shift, update profile, etc.)
  - Component props when passing model data
- See [phase-3-frontend.plan.md](phase-3-frontend.plan.md) for integration points per feature.

---

## File map: types in packages/shared


| File                       | Exports                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `common.ts`                | `Id`, `ModelAttributes`, `ModelAttributesWithoutUpdatedAt`                               |
| `enums.ts`                 | `UserRole`, `RequestType`, `RequestStatus`, `AuditAction`, `AuditEntityType`             |
| `models/user.types.ts`     | `UserBaseAttributes`, `UserBaseAttributesWithId`, `UserAttributes`, `UserLiteAttributes` |
| `models/location.types.ts` | Location types                                                                           |
| `models/skill.types.ts`    | Skill types                                                                              |
| ...                        | One file per model                                                                       |
| `index.ts`                 | Re-export all                                                                            |


