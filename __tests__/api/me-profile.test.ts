import { NextRequest } from "next/server";
import { GET } from "@/app/api/me/profile/route";

describe("GET /api/me/profile", () => {
  it("returns unauthorized without auth cookie", async () => {
    const req = new NextRequest("http://localhost/api/me/profile", {
      method: "GET"
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error.code).toBe("unauthorized");
  });
});
