import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/require-admin";
import { AiModel } from "@/models/AiModel";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const allowedTypes = new Set(["GEMINI", "OPENROUTER", "MISTRAL", "GROQ", "CEREBRAS"]);

const createModelSchema = z.object({
  name: z.string().min(1, "Model name required."),
  type: z.string().optional(),
  enabled: z.boolean().optional()
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(req);
    if (!admin.ok) {
      throw new ApiError(
        admin.status === 401 ? "unauthorized" : "forbidden",
        admin.status === 401 ? "Unauthorized" : "Forbidden",
        admin.status
      );
    }

    await connectDb();

    const models = await AiModel.find();
    models.sort((a, b) => {
      const usageDelta = (a.usageCount ?? 0) - (b.usageCount ?? 0);
      if (usageDelta !== 0) return usageDelta;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });

    return NextResponse.json({ models });
  } catch (error) {
    return toErrorResponse(error, {
      code: "load_ai_models_failed",
      message: "Failed to load AI models.",
      status: 500
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(req);
    if (!admin.ok) {
      throw new ApiError(
        admin.status === 401 ? "unauthorized" : "forbidden",
        admin.status === 401 ? "Unauthorized" : "Forbidden",
        admin.status
      );
    }

    const body = await parseJson(req, createModelSchema);
    const type = body.type ? body.type.trim().toUpperCase() : "GEMINI";
    if (!allowedTypes.has(type)) {
      throw new ApiError("invalid_model_type", "Invalid model type.", 400);
    }

    await connectDb();

    const model = await AiModel.create({
      name: body.name.trim(),
      type,
      enabled: typeof body.enabled === "boolean" ? body.enabled : true
    });

    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, {
      code: "create_ai_model_failed",
      message: "Failed to create AI model.",
      status: 500
    });
  }
}


