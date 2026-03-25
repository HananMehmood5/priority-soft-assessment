# Repository pattern (API)

Contributor note for the assessment codebase (not required for a shallow review).

The API uses a **repository pattern** so that business logic lives in services and data access is isolated in repository classes. Services never inject Sequelize models directly; they depend only on repositories.

## Rules

- **Services** (e.g. `UsersService`, `ShiftsService`) must **not** use `@InjectModel(...)`. They inject and use only **repositories** (and other services/guards).
- **Repositories** live under `apps/api/src/database/repositories/`. They inject Sequelize models and expose methods that encapsulate all queries and writes for that domain.
- **Models** are used only inside repositories and for typing (e.g. GraphQL entities, method return types). The rest of the app stays ORM-agnostic.

## Adding a new feature

1. **New entity / table**
   - Add the Sequelize model under `apps/api/src/database/models/` and register it in `SequelizeModule.forFeature` in `DatabaseModule`.
   - Create a repository under `apps/api/src/database/repositories/` that injects the model and exposes methods (e.g. `findById`, `create`, `findByX`).
   - Add the repository to `DatabaseModule` `providers` and `exports`.
   - In your feature module, import `DatabaseModule` and inject the repository into the service. Do **not** use `SequelizeModule.forFeature` in the feature module.

2. **New use case on an existing entity**
   - Prefer adding a new method to the existing repository that expresses the use case (e.g. `findVisibleForManager(userId)` instead of raw `findAll` in the service).
   - Call that method from the service.

## Repositories

| Repository | Domain | Main models |
|------------|--------|-------------|
| `UserRepository` | Users, availability, desired hours | User, Availability, AvailabilityException, DesiredHours |
| `LocationRepository` | Locations, manager/staff links | Location, ManagerLocation, StaffLocation |
| `SkillRepository` | Skills, staff skills | Skill, StaffSkill |
| `ShiftRepository` | Shifts | Shift |
| `ShiftAssignmentRepository` | Shift assignments | ShiftAssignment |
| `ShiftRequestRepository` | Swap/drop requests | ShiftRequest |
| `NotificationRepository` | Notifications and preferences | Notification, NotificationPreference |
| `AuditLogRepository` | Audit log entries | AuditLog |

All of these are exported from `DatabaseModule`; feature modules that need them import `DatabaseModule`.

## Testing

When writing unit tests for services, mock the repositories (e.g. with `jest.mock` or a test double) instead of mocking Sequelize models. Repository tests, if added, can use the real Sequelize test database or mock the model.
