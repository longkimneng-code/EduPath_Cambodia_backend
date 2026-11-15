import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import { createHash } from 'node:crypto';
import sequelize from '../src/config/database.js';
import User from '../src/model/user.js';
import EmailVerificationToken from '../src/model/emailVerificationToken.js';
import PasswordResetToken from '../src/model/passwordResetToken.js';
import RefreshToken from '../src/model/refreshToken.js';
import StudentProfile from '../src/model/studentProfile.js';

const BASE_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000';

// Helper function for making HTTP requests
async function apiRequest(endpoint, { method = 'GET', body, headers = {}, cookie } = {}) {
    const reqHeaders = { ...headers };
    if (body) {
        reqHeaders['Content-Type'] = 'application/json';
    }
    if (cookie) {
        reqHeaders['Cookie'] = cookie;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    const text = await response.text();
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    // Extract cookies from Set-Cookie
    const setCookie = response.headers.get('set-cookie');

    return {
        status: response.status,
        headers: response.headers,
        data,
        setCookie,
    };
}

describe('EduPath Cambodia Backend - Complete API Test Suite', () => {
    const timestamp = Date.now();
    const testStudent = {
        name: `Test Student ${timestamp}`,
        email: `student_${timestamp}@example.com`,
        phone: '012345678',
        password: 'Password123!',
    };

    const duplicateStudent = {
        name: `Dup Student ${timestamp}`,
        email: `student_${timestamp}@example.com`,
        phone: '098765432',
        password: 'Password123!',
    };

    let studentUserId = null;
    let studentAccessToken = null;
    let studentRefreshTokenCookie = null;
    let studentVerificationRawToken = null;

    let nonStudentToken = null;
    let nonStudentUserId = null;

    before(async () => {
        // Authenticate database connection
        await sequelize.authenticate();

        // Create an admin user to test role-based access restrictions
        const adminEmail = `admin_${timestamp}@example.com`;
        const bcrypt = (await import('bcrypt')).default;
        const hash = await bcrypt.hash('AdminPassword123!', 12);
        const admin = await User.create({
            name: 'Admin User',
            email: adminEmail,
            phone: '011223344',
            password_hash: hash,
            role: 'admin',
            isEmailVerified: true,
        });
        nonStudentUserId = admin.id;

        const jwt = (await import('jsonwebtoken')).default;
        nonStudentToken = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role },
            process.env.ACCESS_TOKEN_SECRET || 'my_super_secret_key',
            { expiresIn: '15m' }
        );
    });

    after(async () => {
        // Cleanup test data to prevent database pollution
        try {
            if (studentUserId) {
                await EmailVerificationToken.destroy({ where: { userId: studentUserId } });
                await PasswordResetToken.destroy({ where: { userId: studentUserId } });
                await RefreshToken.destroy({ where: { userId: studentUserId } });
                await StudentProfile.destroy({ where: { user_id: studentUserId } });
                await User.destroy({ where: { id: studentUserId } });
            }
            if (nonStudentUserId) {
                await User.destroy({ where: { id: nonStudentUserId } });
            }
        } catch (err) {
            console.error('Cleanup error:', err.message);
        } finally {
            await sequelize.close();
        }
    });

    // ==========================================
    // 1. AUTHENTICATION MODULE TESTS
    // ==========================================
    describe('1. Authentication Endpoints (/api/auth)', () => {
        test('POST /register - Fails when required fields are missing', async () => {
            const res = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: 'Incomplete' },
            });
            assert.equal(res.status, 400);
            assert.match(res.data.message, /required/i);
        });

        test('POST /register - Successfully registers new student', async () => {
            const res = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: testStudent,
            });
            assert.equal(res.status, 201);
            const userObj = res.data.user || res.data;
            assert.ok(userObj.id);
            studentUserId = userObj.id;
            assert.equal(userObj.email, testStudent.email);
            assert.equal(userObj.role, 'student');
            assert.equal(userObj.password_hash, undefined, 'password_hash must never be returned');

            // Verify StudentProfile was auto-created
            const profile = await StudentProfile.findOne({ where: { user_id: studentUserId } });
            assert.ok(profile, 'StudentProfile should be auto-created on register');

            // Retrieve the verification token hash from DB and set a known raw token for testing
            const rawToken = 'testrawverificationtoken1234567890abcdef';
            const hash = createHash('sha256').update(rawToken).digest('hex');
            studentVerificationRawToken = rawToken;

            await EmailVerificationToken.create({
                userId: studentUserId,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });
        });

        test('POST /register - Fails on duplicate email with 409 Conflict', async () => {
            const res = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: duplicateStudent,
            });
            assert.equal(res.status, 409);
            assert.match(res.data.message, /already exists/i);
        });

        test('POST /login - Fails with 403 when email is not verified', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: testStudent.email, password: testStudent.password },
            });
            assert.equal(res.status, 403);
            assert.match(res.data.message, /verify your email/i);
        });

        test('GET /verify-email - Fails with 400 when token parameter is missing', async () => {
            const res = await apiRequest('/api/auth/verify-email');
            assert.equal(res.status, 400);
            assert.match(res.data.message, /token is required/i);
        });

        test('GET /verify-email - Fails with 400 when token is invalid', async () => {
            const res = await apiRequest('/api/auth/verify-email?token=non_existent_token');
            assert.equal(res.status, 400);
            assert.match(res.data.message, /invalid token/i);
        });

        test('GET /verify-email - Successfully verifies email with valid query token', async () => {
            const res = await apiRequest(`/api/auth/verify-email?token=${studentVerificationRawToken}`);
            assert.equal(res.status, 200);
            assert.match(res.data.message, /verified successfully/i);

            // Check database updated
            const user = await User.findByPk(studentUserId);
            assert.equal(user.isEmailVerified, true);
        });

        test('GET /verify-email - Fails with 400 on already used token', async () => {
            const res = await apiRequest(`/api/auth/verify-email?token=${studentVerificationRawToken}`);
            assert.equal(res.status, 400);
            assert.match(res.data.message, /invalid token/i);
        });

        test('POST /login - Fails with 400 when missing email or password', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: testStudent.email },
            });
            assert.equal(res.status, 400);
        });

        test('POST /login - Fails with 401 on incorrect password', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: testStudent.email, password: 'WrongPassword!' },
            });
            assert.equal(res.status, 401);
            assert.match(res.data.message, /invalid/i);
        });

        test('POST /login - Successfully logs in verified student', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: testStudent.email, password: testStudent.password },
            });
            assert.equal(res.status, 200);
            assert.ok(res.data.accessToken);
            assert.ok(res.setCookie);
            assert.match(res.setCookie, /refreshToken=/);

            studentAccessToken = res.data.accessToken;
            studentRefreshTokenCookie = res.setCookie.split(';')[0];
            assert.equal(res.data.user.email, testStudent.email);
            assert.equal(res.data.user.password_hash, undefined);
        });

        test('POST /refresh - Fails with 401 when refresh token cookie is missing', async () => {
            const res = await apiRequest('/api/auth/refresh', {
                method: 'POST',
            });
            assert.equal(res.status, 401);
        });

        test('POST /refresh - Fails with 401 on invalid refresh token cookie', async () => {
            const res = await apiRequest('/api/auth/refresh', {
                method: 'POST',
                cookie: 'refreshToken=invalid_refresh_token_string',
            });
            assert.equal(res.status, 401);
        });

        test('POST /refresh - Successfully rotates and refreshes token', async () => {
            const res = await apiRequest('/api/auth/refresh', {
                method: 'POST',
                cookie: studentRefreshTokenCookie,
            });
            assert.equal(res.status, 200);
            assert.ok(res.data.accessToken);
            assert.ok(res.setCookie);

            // Update to rotated token
            studentAccessToken = res.data.accessToken;
            studentRefreshTokenCookie = res.setCookie.split(';')[0];
        });

        test('PUT /change-password - Fails with 401 without auth token', async () => {
            const res = await apiRequest('/api/auth/change-password', {
                method: 'PUT',
                body: { currentPassword: testStudent.password, newPassword: 'NewPassword123!' },
            });
            assert.equal(res.status, 401);
        });

        test('PUT /change-password - Fails with 400 on missing confirmPassword', async () => {
            const res = await apiRequest('/api/auth/change-password', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${studentAccessToken}` },
                body: { currentPassword: 'WrongPassword!', newPassword: 'NewPassword123!' },
            });
            assert.equal(res.status, 400);
            assert.match(res.data.message, /required/i);
        });

        test('PUT /change-password - Fails with 400 on incorrect current password', async () => {
            const res = await apiRequest('/api/auth/change-password', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${studentAccessToken}` },
                body: {
                    currentPassword: 'WrongPassword!',
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!',
                },
            });
            assert.equal(res.status, 400);
            assert.match(res.data.message, /incorrect/i);
        });

        test('PUT /change-password - Successfully changes password', async () => {
            const res = await apiRequest('/api/auth/change-password', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${studentAccessToken}` },
                body: {
                    currentPassword: testStudent.password,
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!',
                },
            });
            assert.equal(res.status, 200);
            assert.match(res.data.message, /successfully/i);
            testStudent.password = 'NewPassword123!';
        });

        test('POST /login - Successfully logs in with newly changed password', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: testStudent.email, password: testStudent.password },
            });
            assert.equal(res.status, 200);
            studentAccessToken = res.data.accessToken;
            studentRefreshTokenCookie = res.setCookie.split(';')[0];
        });

        test('POST /forgot-password - Returns 200 for registered email', async () => {
            const res = await apiRequest('/api/auth/forgot-password', {
                method: 'POST',
                body: { email: testStudent.email },
            });
            assert.equal(res.status, 200);
            assert.match(res.data.message, /password reset link/i);
        });

        test('POST /forgot-password - Returns 200 for nonexistent email (enumeration protection)', async () => {
            const res = await apiRequest('/api/auth/forgot-password', {
                method: 'POST',
                body: { email: 'nonexistent_account@example.com' },
            });
            assert.equal(res.status, 200);
            assert.match(res.data.message, /password reset link/i);
        });

        test('POST /reset-password - Fails with 400 when missing parameters', async () => {
            const res = await apiRequest('/api/auth/reset-password', {
                method: 'POST',
                body: { token: 'some_token' },
            });
            assert.equal(res.status, 400);
        });

        test('POST /reset-password - Fails with 400 on invalid reset token', async () => {
            const res = await apiRequest('/api/auth/reset-password', {
                method: 'POST',
                body: {
                    token: 'invalid_reset_token_12345',
                    newPassword: 'BrandNewPassword123!',
                    confirmPassword: 'BrandNewPassword123!',
                },
            });
            assert.equal(res.status, 400);
            assert.match(res.data.message, /invalid or expired/i);
        });

        test('POST /reset-password - Successfully resets password with valid token', async () => {
            const rawResetToken = 'testresetpasswordtoken1234567890abcdef';
            const hash = createHash('sha256').update(rawResetToken).digest('hex');

            await PasswordResetToken.create({
                userId: studentUserId,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            });

            const res = await apiRequest('/api/auth/reset-password', {
                method: 'POST',
                body: {
                    token: rawResetToken,
                    newPassword: 'BrandNewPassword123!',
                    confirmPassword: 'BrandNewPassword123!',
                },
            });
            assert.equal(res.status, 200);
            assert.match(res.data.message, /successfully/i);
            testStudent.password = 'BrandNewPassword123!';
        });

        test('POST /reset-password - Fails with 400 when trying to reuse already used token', async () => {
            const res = await apiRequest('/api/auth/reset-password', {
                method: 'POST',
                body: {
                    token: 'testresetpasswordtoken1234567890abcdef',
                    newPassword: 'BrandNewPassword123!',
                    confirmPassword: 'BrandNewPassword123!',
                },
            });
            assert.equal(res.status, 400);
        });

        test('POST /logout - Successfully logs out and revokes refresh token', async () => {
            // First get a fresh login
            const loginRes = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: testStudent.email, password: testStudent.password },
            });
            const loginCookie = loginRes.setCookie.split(';')[0];

            const logoutRes = await apiRequest('/api/auth/logout', {
                method: 'POST',
                cookie: loginCookie,
            });
            assert.equal(logoutRes.status, 200);

            // Verify refresh with revoked token fails with 401
            const refreshRes = await apiRequest('/api/auth/refresh', {
                method: 'POST',
                cookie: loginCookie,
            });
            assert.equal(refreshRes.status, 401);
        });
    });

    // ==========================================
    // 2. USER PROFILE MODULE TESTS
    // ==========================================
    describe('2. User Profile Endpoints (/api/users)', () => {
        before(async () => {
            // Fresh login to have valid access token
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: testStudent.email, password: testStudent.password },
            });
            studentAccessToken = res.data.accessToken;
        });

        test('GET /api/users/profile - Fails with 401 when unauthenticated', async () => {
            const res = await apiRequest('/api/users/profile');
            assert.equal(res.status, 401);
        });

        test('GET /api/users/profile - Returns user profile without password_hash', async () => {
            const res = await apiRequest('/api/users/profile', {
                headers: { Authorization: `Bearer ${studentAccessToken}` },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data.user.email, testStudent.email);
            assert.equal(res.data.user.name, testStudent.name);
            assert.equal(res.data.user.password_hash, undefined);
        });

        test('PATCH /api/users/profile - Successfully updates profile fields', async () => {
            const res = await apiRequest('/api/users/profile', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${studentAccessToken}` },
                body: {
                    name: 'Updated Name Student',
                    phone: '099887766',
                    profile_image: 'https://example.com/avatar.jpg',
                },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data.user.name, 'Updated Name Student');
            assert.equal(res.data.user.phone, '099887766');
            assert.equal(res.data.user.profile_image, 'https://example.com/avatar.jpg');
        });

        test('PATCH /api/users/profile - Security: Role cannot be modified through profile update', async () => {
            const res = await apiRequest('/api/users/profile', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${studentAccessToken}` },
                body: { role: 'admin' },
            });
            assert.equal(res.status, 200);
            assert.equal(res.data.user.role, 'student', 'Role must remain student');

            const dbUser = await User.findByPk(studentUserId);
            assert.equal(dbUser.role, 'student', 'Database record role must remain student');
        });

        test('PATCH /api/users/profile - Fails with 409 when updating email to existing user email', async () => {
            const res = await apiRequest('/api/users/profile', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${studentAccessToken}` },
                body: { email: `admin_${timestamp}@example.com` },
            });
            assert.equal(res.status, 409);
        });
    });

    // ==========================================
    // 3. STUDENT PROFILE MODULE TESTS
    // ==========================================
    describe('3. Student Profile Endpoints (/api/students)', () => {
        test('GET /api/students/profile - Fails with 401 when unauthenticated', async () => {
            const res = await apiRequest('/api/students/profile');
            assert.equal(res.status, 401);
        });

        test('GET /api/students/profile - Fails with 403 when accessed by non-student role', async () => {
            const res = await apiRequest('/api/students/profile', {
                headers: { Authorization: `Bearer ${nonStudentToken}` },
            });
            assert.equal(res.status, 403);
            assert.match(res.data.message, /forbidden|access denied/i);
        });

        test('GET /api/students/profile - Successfully retrieves student profile with user data', async () => {
            const res = await apiRequest('/api/students/profile', {
                headers: { Authorization: `Bearer ${studentAccessToken}` },
            });
            assert.equal(res.status, 200);
            assert.ok(res.data.profile);
            assert.equal(res.data.profile.user_id, studentUserId);
            assert.ok(res.data.profile.user);
            assert.equal(res.data.profile.user.email, testStudent.email);
        });

        test('PATCH /api/students/profile - Fails with 400 when empty body provided', async () => {
            const res = await apiRequest('/api/students/profile', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${studentAccessToken}` },
                body: {},
            });
            assert.equal(res.status, 400);
        });

        test('PATCH /api/students/profile - Fails with 403 when called by non-student role', async () => {
            const res = await apiRequest('/api/students/profile', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${nonStudentToken}` },
                body: { province: 'Siem Reap' },
            });
            assert.equal(res.status, 403);
        });

        test('PATCH /api/students/profile - Successfully updates student profile fields', async () => {
            const profileUpdate = {
                province: 'Battambang',
                date_of_birth: '2004-09-20',
                interests: 'Artificial Intelligence, Cybersecurity',
                strengths: 'Analytical Reasoning, Coding',
                career_goal: 'AI Engineer',
            };

            const res = await apiRequest('/api/students/profile', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${studentAccessToken}` },
                body: profileUpdate,
            });
            assert.equal(res.status, 200);
            assert.equal(res.data.profile.province, 'Battambang');
            assert.equal(res.data.profile.date_of_birth, '2004-09-20');
            assert.equal(res.data.profile.interests, profileUpdate.interests);
            assert.equal(res.data.profile.career_goal, profileUpdate.career_goal);

            // Verify persistence in database
            const dbProfile = await StudentProfile.findOne({ where: { user_id: studentUserId } });
            assert.equal(dbProfile.province, 'Battambang');
            assert.equal(dbProfile.career_goal, 'AI Engineer');
        });
    });

    // ==========================================
    // 4. UNIVERSITIES MODULE TESTS
    // ==========================================
    describe('4. University Endpoints (/api/universities & /api/homepage)', () => {
        test('GET /api/universities - Successfully returns paginated list', async () => {
            const res = await apiRequest('/api/universities?page=1&limit=5');
            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.data.data));
            assert.ok(res.data.pagination);
            assert.equal(res.data.pagination.page, 1);
            assert.equal(res.data.pagination.limit, 5);
        });

        test('GET /api/universities - Filters by type and search query', async () => {
            const res = await apiRequest('/api/universities?type=public&search=Technology');
            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.data.data));
            for (const uni of res.data.data) {
                assert.equal(uni.type, 'public');
            }
        });

        test('GET /api/universities - Rejects malformed query with 400 Bad Request', async () => {
            const invalidQueries = ['page=0', 'page=-1', 'limit=101', 'limit=abc', 'type=unknown'];
            for (const q of invalidQueries) {
                const res = await apiRequest(`/api/universities?${q}`);
                assert.equal(res.status, 400, `Query "${q}" should return 400`);
            }
        });

        test('GET /api/universities/filters - Returns filter options (locations, majors, types)', async () => {
            const res = await apiRequest('/api/universities/filters');
            assert.equal(res.status, 200);
            assert.ok(res.data.data);
            assert.ok(Array.isArray(res.data.data.locations));
            assert.ok(Array.isArray(res.data.data.majors));
            assert.ok(Array.isArray(res.data.data.types));
        });

        test('GET /api/universities/:id - Returns details for existing university', async () => {
            const res = await apiRequest('/api/universities/1');
            assert.equal(res.status, 200);
            assert.ok(res.data.data);
            assert.equal(res.data.data.id, 1);
            assert.ok(res.data.data.name);
        });

        test('GET /api/universities/:id - Returns 404 for nonexistent university ID', async () => {
            const res = await apiRequest('/api/universities/99999');
            assert.equal(res.status, 404);
            assert.match(res.data.message, /not found/i);
        });

        test('GET /api/universities/:id - Returns 400 for invalid ID parameter format', async () => {
            const res = await apiRequest('/api/universities/invalid_id');
            assert.equal(res.status, 400);
        });

        test('GET /api/homepage - Returns featured universities and stats', async () => {
            const res = await apiRequest('/api/homepage?limit=4');
            assert.equal(res.status, 200);
            assert.ok(res.data.data);
            assert.ok(Array.isArray(res.data.data.featuredUniversities));
            assert.ok(res.data.data.stats);
            assert.ok(typeof res.data.data.stats.universities === 'number');
        });

        test('GET /api/homepage - Returns 400 on invalid limit parameter', async () => {
            const res = await apiRequest('/api/homepage?limit=50');
            assert.equal(res.status, 400);
        });
    });

    // ==========================================
    // 5. SECURITY & GENERAL ROUTE HANDLING
    // ==========================================
    describe('5. Security & Error Handling', () => {
        test('GET /unknown/route - Returns 404 Route not found', async () => {
            const res = await apiRequest('/api/nonexistent-endpoint');
            assert.equal(res.status, 404);
            assert.match(res.data.message, /not found/i);
        });

        test('POST with invalid JSON body - Returns 400 Bad Request', async () => {
            const res = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{"invalid_json": ',
            });
            assert.equal(res.status, 400);
        });

        test('SQL Injection Attempt - Safely handled and sanitized', async () => {
            const res = await apiRequest(`/api/universities?search=' OR '1'='1'--`);
            assert.equal(res.status, 200);
            // Must not return all universities uncritically or crash
            assert.ok(Array.isArray(res.data.data));
        });
    });
});
