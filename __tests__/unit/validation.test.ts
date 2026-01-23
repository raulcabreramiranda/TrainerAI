import { z } from "zod";
import { requiredEmail, requiredString } from "@/lib/api/validation";

describe("validation helpers", () => {
  it("enforces required string", () => {
    const schema = z.object({ name: requiredString("Name required") });
    const result = schema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Name required");
    }
  });

  it("validates and trims email", () => {
    const schema = z.object({
      email: requiredEmail("Email required", "Email invalid")
    });
    const result = schema.safeParse({ email: " person@example.com " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("person@example.com");
    }
  });
});
