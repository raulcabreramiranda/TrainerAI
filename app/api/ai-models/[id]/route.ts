import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/require-admin";
import { AiModel } from "@/models/AiModel";
import { ApiError } from "@/lib/api/errors";
import { parseJson, parseParams, toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const allowedTypes = new Set(["GEMINI", "OPENROUTER", "MISTRAL", "GROQ", "CEREBRAS"]);

const modelIdSchema = z.object({
  id: z.string().min(1, "Invalid request.")
});

const updateModelSchema = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
    enabled: z.boolean().optional()
  })
  .passthrough();

export async function GET(req: NextRequest, context: { params: { id: string } }) {
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

    const { id } = parseParams(context.params, modelIdSchema);
    const model = await AiModel.findById(id);
    if (!model) {
      throw new ApiError("model_not_found", "Model not found.", 404);
    }

    return NextResponse.json({ model });
  } catch (error) {
    return toErrorResponse(error, {
      code: "load_ai_model_failed",
      message: "Failed to load AI model.",
      status: 500
    });
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    const admin = await requireAdminFromRequest(req);
    if (!admin.ok) {
      throw new ApiError(
        admin.status === 401 ? "unauthorized" : "forbidden",
        admin.status === 401 ? "Unauthorized" : "Forbidden",
        admin.status
      );
    }

    const { id } = parseParams(context.params, modelIdSchema);
    const body = await parseJson(req, updateModelSchema);

    const update: Record<string, unknown> = {};
    if (body.name) {
      update.name = body.name.trim();
    }
    if (body.type) {
      const type = body.type.trim().toUpperCase();
      if (!allowedTypes.has(type)) {
        throw new ApiError("invalid_model_type", "Invalid model type.", 400);
      }
      update.type = type;
    }
    if (typeof body.enabled === "boolean") {
      update.enabled = body.enabled;
    }

    if (Object.keys(update).length === 0) {
      throw new ApiError("no_updates", "No updates provided.", 400);
    }

    await connectDb();

    const model = await AiModel.findByIdAndUpdate(id, update, {
      new: true
    });
    if (!model) {
      throw new ApiError("model_not_found", "Model not found.", 404);
    }

    return NextResponse.json({ model });
  } catch (error) {
    return toErrorResponse(error, {
      code: "update_ai_model_failed",
      message: "Failed to update AI model.",
      status: 500
    });
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
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

    const { id } = parseParams(context.params, modelIdSchema);
    const model = await AiModel.findByIdAndDelete(id);
    if (!model) {
      throw new ApiError("model_not_found", "Model not found.", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, {
      code: "delete_ai_model_failed",
      message: "Failed to delete AI model.",
      status: 500
    });
  }
}


