import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { connectDb } from "@/lib/db";
import { User } from "@/models/User";
import { setAuthCookie, signJwt, verifyPassword } from "@/lib/auth";

jest.mock("@/lib/db", () => ({
  connectDb: jest.fn()
}));

jest.mock("@/models/User", () => ({
  User: {
    findOne: jest.fn()
  }
}));

jest.mock("@/lib/auth", () => ({
  setAuthCookie: jest.fn(),
  signJwt: jest.fn(),
  verifyPassword: jest.fn()
}));

describe("POST /api/auth/login", () => {
  const mockedConnectDb = connectDb as jest.Mock;
  const mockedFindOne = User.findOne as jest.Mock;
  const mockedVerifyPassword = verifyPassword as jest.Mock;
  const mockedSignJwt = signJwt as jest.Mock;
  const mockedSetAuthCookie = setAuthCookie as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns validation error for missing fields", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({})
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.code).toBe("invalid_request");
    expect(typeof data.error.message).toBe("string");
  });

  it("sets auth cookie for valid credentials", async () => {
    mockedConnectDb.mockResolvedValue(undefined);
    mockedFindOne.mockResolvedValue({
      _id: "user-123",
      status: "active",
      passwordHash: "hash"
    });
    mockedVerifyPassword.mockResolvedValue(true);
    mockedSignJwt.mockReturnValue("token");

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "me@example.com",
        password: "secret"
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(mockedFindOne).toHaveBeenCalledWith({ email: "me@example.com" });
    expect(mockedSetAuthCookie).toHaveBeenCalled();
  });
});
