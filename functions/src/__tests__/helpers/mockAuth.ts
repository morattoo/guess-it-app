/**
 * Mocks firebase-admin/auth and firebase-admin/app-check so that
 * authMiddleware and appCheckMiddleware always pass in tests.
 *
 * Call setupAuthMocks() once per test file (e.g. in beforeAll).
 */

export const TEST_USER = { uid: "user-123", email: "test@example.com" };

export function setupAuthMocks() {
  jest.mock("firebase-admin/auth", () => ({
    getAuth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: TEST_USER.uid,
        email: TEST_USER.email,
      }),
    }),
  }));

  jest.mock("firebase-admin/app-check", () => ({
    getAppCheck: jest.fn().mockReturnValue({
      verifyToken: jest.fn().mockResolvedValue({ appId: "mock-app" }),
    }),
  }));
}
