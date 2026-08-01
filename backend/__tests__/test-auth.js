const request = require("supertest");
const app = require("./src/app");
const prisma = require("./src/config/database");

describe("Authentication System", () => {
  beforeAll(async () => {
    // Clean up database before tests
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          phone: "+237612345678",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty("email", "test@example.com");
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    it("should fail with duplicate email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com", // Same email
          phone: "+237612345679",
          password: "password123",
          firstName: "Jane",
          lastName: "Doe",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty("email", "test@example.com");
      expect(response.body.data).toHaveProperty("accessToken");
    });

    it("should fail with wrong password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    let refreshToken;

    beforeAll(async () => {
      // Login to get tokens
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });
      
      refreshToken = response.body.data.refreshToken;
    });

    it("should refresh access token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let accessToken;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });
      
      accessToken = response.body.data.accessToken;
    });

    it("should get current user with valid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("email", "test@example.com");
    });

    it("should fail without token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});