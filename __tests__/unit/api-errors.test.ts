import { getErrorFields, getErrorMessage } from "@/lib/api/errors";

describe("api error helpers", () => {
  it("returns message from strings and objects", () => {
    expect(getErrorMessage("Nope")).toBe("Nope");
    expect(getErrorMessage({ message: "Boom" })).toBe("Boom");
    expect(getErrorMessage({})).toBeNull();
  });

  it("extracts field errors when present", () => {
    const fields = getErrorFields({
      fields: {
        email: "Email is required",
        password: "Password is required",
        count: 2
      }
    });

    expect(fields).toEqual({
      email: "Email is required",
      password: "Password is required"
    });
  });
});
