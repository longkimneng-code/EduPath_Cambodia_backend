# Chann Siekfong - Sprint 1 API handoff

Scope: University APIs and Homepage data APIs, October 22-November 4, 2026.
Stack: Express 5, Sequelize 6, MySQL. Existing authentication endpoints remain at `/api/auth`.

## Run locally

1. Install dependencies with `npm install`.
2. Configure the existing `.env`: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `PORT` (default `5000`). Retain the authentication secrets configured by Daro. Never commit `.env`.
3. Coordinate the schema with Kol, then run `npm run db:discovery` against the intended database. This creates only missing `universities`, `majors`, and `university_majors` tables, without altering existing tables. MySQL DDL is not transactional: if setup fails partway, already created tables remain and a retry skips them.
4. Run `npm start` or `npm run dev`. The existing startup process also authenticates and calls `sequelize.sync()` to create missing tables. It does not use `force` or `alter`.
5. Optional: after tables exist, run `npm run seed:universities`. This explicitly writes demonstration records to the configured database. It is never run automatically, never deletes records, and never overwrites existing records.
6. Run `npm test` for automated checks. Tests do not connect to or change a database.

## Endpoints

All endpoints below are public GET requests. Browsing universities does not require login.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/universities` | Searchable, filtered, paginated university cards, including majors |
| GET | `/api/universities/filters` | Available locations, major IDs/names, and university types |
| GET | `/api/universities/:id` | University details and associated majors |
| GET | `/api/homepage` | Featured university cards and database-backed counts |

### University query parameters

| Parameter | Accepted value | Default |
| --- | --- | --- |
| `search` | Text, up to 150 characters; matches name or abbreviation | No search |
| `location` | Exact province/city name from filter metadata | All locations |
| `majorId` | Positive integer from filter metadata | All majors |
| `type` | `public` or `private` | Both |
| `featured` | `true` or `false` | Both |
| `sort` | `name`, `name_desc`, `newest`, `tuition_asc` | `name` |
| `page` | Integer 1-1,000,000 | `1` |
| `limit` | Integer 1-100 | `12` |

Example: `GET /api/universities?search=Technology&location=Phnom%20Penh&type=public&page=1&limit=12`

`tuition_asc` uses MySQL's ascending order, so records with unknown (`null`) fees appear first. Fees are meaningful only with `currency` and `tuitionPeriod`; this sort does not convert currencies or billing periods.

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 12, "total": 0, "totalPages": 0 }
}
```

An empty database or no matches produces the response above, not fake records. A page beyond the last page returns an empty `data` array and the actual totals.

### University details

`GET /api/universities/1` returns `{ "data": { ... } }` with the model fields and a `majors` array. Available fields include `name`, `slug`, `shortName`, `type`, `province`, `description`, `address`, `website`, `email`, `phone`, `imageUrl`, `logoUrl`, `latitude`, `longitude`, `tuitionMin`, `tuitionMax`, `currency`, `tuitionPeriod`, `departments`, `facilities`, `admissionRequirements`, `sourceUrl`, and `informationVerifiedAt`.

Optional information remains `null` until supplied. Sequelize/MySQL may serialize DECIMAL values as strings; the frontend should handle this when displaying fees and map coordinates. JSON content fields should be arrays when populated. No placeholder images or unverified admission requirements are returned.

### Homepage

`GET /api/homepage?limit=4` accepts `limit` between 1 and 12 (default 4):

```json
{
  "data": {
    "featuredUniversities": [],
    "stats": { "universities": 0, "majors": 0, "locations": 0 }
  }
}
```

Counts come from stored university and major rows. These catalog counts do not imply verification. Scholarship and event counts are not included because their models/APIs belong to later work. Hero headings, navigation, and other static UI copy belong in the frontend.

### Errors

Invalid IDs/parameters return HTTP `400`; missing university IDs and unknown routes return `404`; unexpected server/database errors return `500`. All use `{ "message": "..." }`. Internal errors are logged server-side and are not exposed in responses.

## Coordination with Kol and Daro

- Added minimal `University`, `Major`, and `UniversityMajor` models because those models were not present in this checkout. Reconcile these with Kol's ERD and migrations before merging. University and major IDs are integers; `university_majors` has a composite primary key. Repository associations use aliases `majors` and `universities`.
- The seed creates a small Cambodia-focused demo catalog. It deliberately leaves program associations, fees, admissions data, and verification timestamps unset. Kol can add verified university-major relationships through `UniversityMajor`; otherwise `majorId` filtering correctly finds no associations.
- The existing refresh-token model referenced `users.user_id`, but the User model defines `users.id`. Corrected the foreign-key reference so table creation uses the actual primary key. No existing database alteration was executed.
- The existing MySQL connection and SSL settings are unchanged. A read-only inspection successfully connected to the configured MySQL database. It currently has no university, major, or university-major tables. No schema creation or seed writes were executed against it.
- Integration into `fong-branch` preserves the newer authentication, user-profile, student-profile, migration commands, and Swagger documentation from your teammates. The earlier inspection of the user schema preceded those updates.
- For frontend development, proxy `/api` to the backend from the frontend dev server or serve both under the same origin; cross-origin settings are not changed in this task.

## Verification performed

All 12 tests pass. They exercise real local HTTP requests with an injected repository, including pagination, combined filters, malformed input, details/404s, filter route ordering, homepage limits, empty results, and generic errors. An integration regression check also verifies that existing profile routes remain protected and Swagger remains available. Repository tests check literal search escaping and distinct university pagination under major filtering. This verifies request handling and query construction. Live MySQL connectivity and schema inspection passed; endpoint integration against real discovery tables remains pending their setup.

Later assignments in the PDF remain: Sprint 2 scholarship APIs; Sprint 3 Favorites and admin content-management APIs.
