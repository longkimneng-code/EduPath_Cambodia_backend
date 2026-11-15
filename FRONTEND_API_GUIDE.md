
  }
);
```

---

## 4. API Endpoints Specification

### A. Authentication Module (`/api/auth`)

#### 1. Register Account
* **Method**: `POST`
* **URL**: `/api/auth/register`
* **Auth Required**: No
* **Request Body**:
```json
{
  "name": "Sok Daro",
  "email": "daro@gmail.com",
  "phone": "012345678",
  "password": "Password123!"
}
```
* **Success Response (201 Created)**:
```json
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "name": "Sok Daro",
    "email": "daro@gmail.com",
    "phone": "012345678",
    "role": "student",
    "profile_image": null,
    "created_at": "2026-11-15T10:00:00.000Z",
    "updated_at": "2026-11-15T10:00:00.000Z"
  }
}
```
* **Error Responses**:
  * `400`: Missing required fields (`{ "message": "Name, email, phone, and password are required" }`)
  * `409`: Email conflict (`{ "message": "Email already exists" }`)

---

#### 2. Verify Email
Supports both URL link clicks (query parameter) and single-page application requests (JSON body).
* **Method**: `GET` or `POST`
* **URL**: `/api/auth/verify-email?token=<token>` or `POST /api/auth/verify-email`
* **Request Body (POST only)**:
```json
{
  "token": "64_character_hex_token"
}
```
* **Success Response (200 OK)**:
```json
{
  "message": "Email verified successfully"
}
```
* **Error Responses**:
  * `400`: Missing, invalid, or expired token (`{ "message": "Invalid token" }` or `{ "message": "Token has expired" }`)

---

#### 3. Login
* **Method**: `POST`
* **URL**: `/api/auth/login`
* **Auth Required**: No
* **Request Body**:
```json
{
  "email": "daro@gmail.com",
  "password": "Password123!"
}
```
* **Success Response (200 OK)**:
*(Also sets `Set-Cookie: refreshToken=...; Path=/api/auth; HttpOnly; SameSite=Lax`)*
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Sok Daro",
    "email": "daro@gmail.com",
    "phone": "012345678",
    "role": "student",
    "profile_image": null,
    "created_at": "2026-11-15T10:00:00.000Z",
    "updated_at": "2026-11-15T10:00:00.000Z"
  }
}
```
* **Error Responses**:
  * `400`: Missing email or password
  * `401`: Invalid email or password
  * `403`: Email not verified (`{ "message": "Please verify your email before logging in" }`)

---

#### 4. Refresh Access Token
* **Method**: `POST`
* **URL**: `/api/auth/refresh`
* **Auth Required**: Yes (`refreshToken` cookie automatically sent with credentials)
* **Request Body**: None
* **Success Response (200 OK)**:
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Error Responses**:
  * `401`: Missing, expired, or revoked refresh token

---

#### 5. Logout
* **Method**: `POST`
* **URL**: `/api/auth/logout`
* **Auth Required**: Yes (`refreshToken` cookie)
* **Request Body**: None
* **Success Response (200 OK)**:
*(Clears `refreshToken` cookie and deletes token from database)*
```json
{
  "message": "Logout successfully"
}
```

---

#### 6. Change Password
* **Method**: `PUT`
* **URL**: `/api/auth/change-password`
* **Auth Required**: Yes (Bearer Token)
* **Request Body**:
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```
* **Success Response (200 OK)**:
*(Revokes all existing refresh tokens for security)*
```json
{
  "message": "Password changed successfully"
}
```
* **Error Responses**:
  * `400`: Incorrect current password or password mismatch
  * `401`: Unauthorized

---

#### 7. Forgot Password
* **Method**: `POST`
* **URL**: `/api/auth/forgot-password`
* **Auth Required**: No
* **Request Body**:
```json
{
  "email": "student@gmail.com"
}
```
* **Success Response (200 OK)**:
```json
{
  "message": "If your email is registered, you will receive a password reset link."
}
```

---

#### 8. Reset Password
* **Method**: `POST`
* **URL**: `/api/auth/reset-password`
* **Auth Required**: No
* **Request Body**:
```json
{
  "token": "64_character_reset_token",
  "newPassword": "BrandNewPassword123!",
  "confirmPassword": "BrandNewPassword123!"
}
```
* **Success Response (200 OK)**:
```json
{
  "message": "Password reset successfully"
}
```
* **Error Responses**:
  * `400`: Passwords do not match, length < 8 chars, or invalid/expired reset token

---

### B. User Profile Module (`/api/users`)

#### 1. Get Current User Profile
* **Method**: `GET`
* **URL**: `/api/users/profile`
* **Auth Required**: Yes (Bearer Token)
* **Success Response (200 OK)**:
```json
{
  "message": "User profile retrieved successfully",
  "user": {
    "id": 1,
    "name": "Sok Daro",
    "email": "daro@gmail.com",
    "role": "student",
    "profile_image": "https://example.com/avatar.jpg",
    "phone": "012345678",
    "created_at": "2026-11-15T10:00:00.000Z",
    "updated_at": "2026-11-15T10:00:00.000Z"
  }
}
```

#### 2. Update User Profile
* **Method**: `PATCH` or `PUT`
* **URL**: `/api/users/profile`
* **Auth Required**: Yes (Bearer Token)
* **Request Body** *(All fields optional)*:
```json
{
  "name": "Sok Daro Updated",
  "email": "daro.new@gmail.com",
  "phone": "098765432",
  "profile_image": "https://example.com/new-avatar.jpg"
}
```
*Note: Users cannot update their own `role` through this endpoint.*
* **Success Response (200 OK)**:
```json
{
  "message": "User profile updated successfully",
  "user": {
    "id": 1,
    "name": "Sok Daro Updated",
    "email": "daro.new@gmail.com",
    "role": "student",
    "profile_image": "https://example.com/new-avatar.jpg",
    "phone": "098765432",
    "created_at": "2026-11-15T10:00:00.000Z",
    "updated_at": "2026-11-15T10:30:00.000Z"
  }
}
```
* **Error Responses**:
  * `409`: Email already in use by another user

---

### C. Student Profile Module (`/api/students`)

*Note: Access to `/api/students/*` is strictly restricted to accounts with `role: "student"`. Non-student accounts (admin, faculty) receive `403 Access denied`.*

#### 1. Get Student Profile
* **Method**: `GET`
* **URL**: `/api/students/profile`
* **Auth Required**: Yes (Bearer Token, Student Role)
* **Success Response (200 OK)**:
```json
{
  "message": "Student profile retrieved successfully",
  "profile": {
    "id": 1,
    "user_id": 1,
    "province": "Phnom Penh",
    "date_of_birth": "2004-05-15",
    "interests": "Computer Science, AI, Web Development",
    "strengths": "Problem solving, analytical thinking",
    "career_goal": "Full Stack Software Engineer",
    "created_at": "2026-11-15T10:00:00.000Z",
    "user": {
      "id": 1,
      "name": "Sok Daro",
      "email": "daro@gmail.com",
      "role": "student",
      "profile_image": null,
      "phone": "012345678"
    }
  }
}
```

#### 2. Update Student Profile
* **Method**: `PATCH` or `PUT`
* **URL**: `/api/students/profile`
* **Auth Required**: Yes (Bearer Token, Student Role)
* **Request Body** *(At least one field required)*:
```json
{
  "province": "Siem Reap",
  "date_of_birth": "2004-05-15",
  "interests": "Cloud Computing, DevOps",
  "strengths": "System design, critical thinking",
  "career_goal": "Cloud Solutions Architect"
}
```
* **Success Response (200 OK)**:
```json
{
  "message": "Student profile updated successfully",
  "profile": {
    "id": 1,
    "user_id": 1,
    "province": "Siem Reap",
    "date_of_birth": "2004-05-15",
    "interests": "Cloud Computing, DevOps",
    "strengths": "System design, critical thinking",
    "career_goal": "Cloud Solutions Architect",
    "created_at": "2026-11-15T10:00:00.000Z"
  }
}
```
* **Error Responses**:
  * `400`: Empty update body provided (`{ "message": "At least one field is required" }`)
  * `403`: Non-student role access attempt

---

### D. Discovery & University Module (`/api`)

#### 1. List Universities
* **Method**: `GET`
* **URL**: `/api/universities`
* **Auth Required**: No
* **Query Parameters**:
  * `page` (number, default: 1, min: 1)
  * `limit` (number, default: 12, min: 1, max: 100)
  * `search` (string, max 150 chars, searches name and shortName)
  * `location` (string, e.g. "Phnom Penh")
  * `type` (`"public"` | `"private"`)
  * `sort` (`"name"` | `"name_desc"` | `"newest"` | `"tuition_asc"`, default: `"name"`)
  * `featured` (`true` | `false`)
  * `majorId` (number, filters universities offering that major)
* **Example Query**: `/api/universities?search=Technology&type=public&page=1&limit=10`
* **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 2,
      "slug": "institute-of-technology-of-cambodia",
      "name": "Institute of Technology of Cambodia",
      "shortName": "ITC",
      "description": "Leading engineering institution in Cambodia.",
      "type": "public",
      "province": "Phnom Penh",
      "imageUrl": "https://example.com/itc-campus.jpg",
      "logoUrl": "https://example.com/itc-logo.png",
      "tuitionMin": 450,
      "tuitionMax": 800,
      "currency": "USD",
      "tuitionPeriod": "year",
      "isFeatured": true,
      "sourceUrl": "https://itc.edu.kh",
      "informationVerifiedAt": "2026-10-30T10:00:00.000Z",
      "majors": [
        {
          "id": 1,
          "name": "Computer Science",
          "degreeLevel": "Bachelor"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 24,
    "totalPages": 3
  }
}
```

---

#### 2. Get Filter Options
Use this endpoint to populate dropdowns, checkboxes, and filters on discovery pages.
* **Method**: `GET`
* **URL**: `/api/universities/filters`
* **Auth Required**: No
* **Success Response (200 OK)**:
```json
{
  "data": {
    "locations": [
      "Battambang",
      "Kampong Cham",
      "Phnom Penh",
      "Siem Reap"
    ],
    "majors": [
      {
        "id": 2,
        "name": "Business Administration",
        "degreeLevel": "Bachelor"
      },
      {
        "id": 1,
        "name": "Computer Science",
        "degreeLevel": "Bachelor"
      }
    ],
    "types": [
      "public",
      "private"
    ]
  }
}
```

---

#### 3. University Details
* **Method**: `GET`
* **URL**: `/api/universities/:id`
* **Auth Required**: No
* **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "name": "Royal University of Phnom Penh",
    "slug": "royal-university-of-phnom-penh",
    "shortName": "RUPP",
    "description": "Oldest and largest public university in Cambodia.",
    "type": "public",
    "province": "Phnom Penh",
    "address": "Russian Federation Boulevard, Toul Kork, Phnom Penh",
    "website": "https://www.rupp.edu.kh/",
    "email": "info@rupp.edu.kh",
    "phone": "+855 23 883 640",
    "imageUrl": "https://example.com/rupp-campus.jpg",
    "logoUrl": "https://example.com/rupp-logo.png",
    "tuitionMin": 400,
    "tuitionMax": 700,
    "currency": "USD",
    "tuitionPeriod": "year",
    "departments": "Faculty of Science, Faculty of Engineering, IFL",
    "facilities": "Library, Computer Labs, Cafeteria, Sports Ground",
    "admissionRequirements": "High school diploma and entrance examination.",
    "isFeatured": true,
    "majors": [
      {
        "id": 1,
        "name": "Computer Science",
        "degreeLevel": "Bachelor"
      }
    ]
  }
}
```
* **Error Responses**:
  * `400`: Invalid ID format (`{ "message": "Invalid id" }`)
  * `404`: Non-existent ID (`{ "message": "University not found" }`)

---

#### 4. Homepage Featured Data
* **Method**: `GET`
* **URL**: `/api/homepage`
* **Auth Required**: No
* **Query Parameters**: `limit` (number, default: 4, min: 1, max: 12)
* **Success Response (200 OK)**:
```json
{
  "data": {
    "featuredUniversities": [
      {
        "id": 1,
        "slug": "royal-university-of-phnom-penh",
        "name": "Royal University of Phnom Penh",
        "shortName": "RUPP",
        "type": "public",
        "province": "Phnom Penh",
        "imageUrl": "https://example.com/rupp.jpg",
        "isFeatured": true,
        "majors": []
      }
    ],
    "stats": {
      "universities": 24,
      "majors": 32,
      "locations": 6
    }
  }
}
```

---

## 5. Standard Error Format

Every error returned by the backend follows a uniform JSON structure:

```json
{
  "message": "Human-readable error description"
}
```

### Common HTTP Status Codes:
| Status | Meaning | Action to take on Frontend |
|---|---|---|
| **200 / 201** | Success | Render UI / state update |
| **400** | Bad Request | Display validation message returned in `message` |
| **401** | Unauthorized | Token expired or missing. Attempt `POST /api/auth/refresh`, or redirect to `/login` |
| **403** | Forbidden | Email unverified or user does not have sufficient role |
| **404** | Not Found | Show empty state or 404 page |
| **409** | Conflict | Duplicate resource (e.g. email already registered) |
| **429** | Too Many Requests | Rate limited. Prompt user to wait before retrying |
| **500** | Server Error | Generic error modal ("Something went wrong, please try again") |

---

## 6. End-to-End Frontend Workflows

### Flow 1: Registration & Verification
1. User submits `POST /api/auth/register` with `name`, `email`, `phone`, `password`.
2. Backend creates user with `is_email_verified = false`, creates an empty `StudentProfile`, and sends an activation email.
3. Frontend shows: *"Registration successful! Check your inbox to verify your account."*
4. User clicks email link leading to: `${FRONTEND_URL}/verify-email?token=<token>`.
5. Frontend page mounts and calls `GET /api/auth/verify-email?token=<token>` or `POST /api/auth/verify-email`.
6. On success, redirect user to `/login` with success banner.

### Flow 2: Login & State Management
1. User submits `POST /api/auth/login`.
2. On 200:
   - Store `accessToken` in memory (React State / Store).
   - Store `user` object in state / localStorage for UI display.
   - The browser automatically handles the `refreshToken` cookie.
3. Redirect user to `/dashboard` or `/discover`.

### Flow 3: App Mount & Silent Login
1. On initial frontend app mount (e.g. `App.tsx` or `_app.tsx`), call `POST /api/auth/refresh`.
2. If 200:
   - Save new `accessToken` to memory.
   - Call `GET /api/users/profile` to get fresh profile data.
   - User is seamlessly logged in without typing credentials.
3. If 401:
   - User is unauthenticated (render public / guest view).

### Flow 4: Logout
1. User clicks Logout.
2. Call `POST /api/auth/logout`.
3. Clear `accessToken` and user info from memory.
4. Redirect to `/login`.
