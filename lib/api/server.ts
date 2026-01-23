import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, type ApiErrorPayload } from "@/lib/api/errors";

const formatZodErrors = (error: z.ZodError) => {
  const fields: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".") || "root";
    if (!fields[path]) {
      fields[path] = issue.message;
    }
  });
  return fields;
};

export async function parseJson<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("invalid_json", "Invalid request.", 400);
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid request.";
    throw new ApiError(
      "invalid_request",
      message,
      400,
      formatZodErrors(result.error)
    );
  }
  return result.data;
}

export function parseSearchParams<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): T {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid request.";
    throw new ApiError(
      "invalid_request",
      message,
      400,
      formatZodErrors(result.error)
    );
  }
  return result.data;
}

export function parseParams<T>(
  params: Record<string, unknown>,
  schema: z.ZodType<T>
): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid request.";
    throw new ApiError(
      "invalid_request",
      message,
      400,
      formatZodErrors(result.error)
    );
  }
  return result.data;
}

export function toErrorResponse(
  error: unknown,
  fallback?: { code: string; message: string; status?: number }
) {
  if (error instanceof ApiError) {
    const payload: ApiErrorPayload = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {})
      }
    };
    return NextResponse.json(payload, { status: error.status });
  }

  console.error("API error", error);
  const payload: ApiErrorPayload = {
    error: {
      code: fallback?.code ?? "internal_error",
      message: fallback?.message ?? "Something went wrong."
    }
  };
  return NextResponse.json(payload, { status: fallback?.status ?? 500 });
}
