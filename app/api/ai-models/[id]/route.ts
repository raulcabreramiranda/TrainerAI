import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/require-admin";
import { AiModel } from "@/models/AiModel";
import { isNonEmptyString } from "@/lib/validation";

const allowedTypes = new Set(["GEMINI", "OPENROUTER", "MISTRAL", "GROQ", "CEREBRAS"]);

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const admin = await requireAdminFromRequest(req);
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.status }
      );
    }

    await connectDb();

    const model = await AiModel.findById(context.params.id);
    if (!model) {
      return NextResponse.json({ error: "Model not found." }, { status: 404 });
    }

    return NextResponse.json({ model });
  } catch (error) {
    console.error("Get AI model error", error);
    return NextResponse.json({ error: "Failed to load AI model." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    const admin = await requireAdminFromRequest(req);
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.status }
      );
    }

    const body = (await req.json()) as { name?: string; type?: string; enabled?: boolean };

    const update: Record<string, unknown> = {};
    if (isNonEmptyString(body.name)) {
      update.name = body.name.trim();
    }
    if (isNonEmptyString(body.type)) {
      const type = body.type.trim().toUpperCase();
      if (!allowedTypes.has(type)) {
        return NextResponse.json({ error: "Invalid model type." }, { status: 400 });
      }
      update.type = type;
    }
    if (typeof body.enabled === "boolean") {
      update.enabled = body.enabled;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    await connectDb();

    const model = await AiModel.findByIdAndUpdate(context.params.id, update, {
      new: true
    });
    if (!model) {
      return NextResponse.json({ error: "Model not found." }, { status: 404 });
    }

    return NextResponse.json({ model });
  } catch (error) {
    console.error("Update AI model error", error);
    return NextResponse.json({ error: "Failed to update AI model." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const admin = await requireAdminFromRequest(req);
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.status }
      );
    }

    await connectDb();

    const model = await AiModel.findByIdAndDelete(context.params.id);
    if (!model) {
      return NextResponse.json({ error: "Model not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete AI model error", error);
    return NextResponse.json({ error: "Failed to delete AI model." }, { status: 500 });
  }
}
