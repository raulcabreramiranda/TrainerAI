import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/require-admin";
import { AiModel } from "@/models/AiModel";
import { isNonEmptyString } from "@/lib/validation";

const allowedTypes = new Set(["GEMINI", "OPENROUTER", "MISTRAL", "GROQ", "CEREBRAS"]);

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(req);
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.status }
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
    console.error("List AI models error", error);
    return NextResponse.json({ error: "Failed to load AI models." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(req);
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: admin.status }
      );
    }

    const body = (await req.json()) as { name?: string; type?: string; enabled?: boolean };
    if (!isNonEmptyString(body.name)) {
      return NextResponse.json({ error: "Model name required." }, { status: 400 });
    }
    const type = isNonEmptyString(body.type) ? body.type.trim().toUpperCase() : "GEMINI";
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ error: "Invalid model type." }, { status: 400 });
    }

    await connectDb();

    const model = await AiModel.create({
      name: body.name.trim(),
      type,
      enabled: typeof body.enabled === "boolean" ? body.enabled : true
    });

    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    console.error("Create AI model error", error);
    return NextResponse.json({ error: "Failed to create AI model." }, { status: 500 });
  }
}
