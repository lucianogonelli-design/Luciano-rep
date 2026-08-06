import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processMessage } from "@/lib/ai-agent";

// ---------------------------------------------------------------------------
// POST — Manual chat endpoint for testing the AI agent
// Body: { message: string, conversationId: string }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = body as {
      message?: string;
      conversationId?: string;
    };

    // Validate required fields
    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (
      !conversationId ||
      typeof conversationId !== "string" ||
      conversationId.trim() === ""
    ) {
      return NextResponse.json(
        { error: "conversationId is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // 1. Verify the conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: {
          include: {
            doctor: {
              include: { aiSettings: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // 2. Resolve the doctor and AI settings
    const doctor = conversation.patient?.doctor;
    const aiSettings = doctor?.aiSettings;

    if (!doctor || !aiSettings) {
      return NextResponse.json(
        {
          error:
            "No doctor or AI settings associated with this conversation. Please configure AI settings first.",
        },
        { status: 422 }
      );
    }

    // 3. Save the user message
    await prisma.message.create({
      data: {
        content: message.trim(),
        role: "user",
        mediaType: "text",
        conversationId,
      },
    });

    // 4. Load conversation history
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: "asc" },
      take: 50,
    });

    const conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 5. Load knowledge base (RAG)
    const knowledgeDocs = await prisma.knowledgeBase.findMany({
      where: { doctorId: doctor.id, isActive: true },
      select: { category: true, title: true, content: true },
    });

    // 6. Call AI agent
    const responseText = await processMessage(
      message.trim(),
      conversationHistory,
      {
        provider: aiSettings.provider as "openai" | "anthropic",
        model: aiSettings.model,
        systemPrompt: aiSettings.systemPrompt,
        maxTokens: aiSettings.maxTokens,
        temperature: aiSettings.temperature,
        schedulingEnabled: aiSettings.schedulingEnabled,
        clinicName: doctor.clinicName ?? undefined,
        clinicAddress: doctor.clinicAddress ?? undefined,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        knowledgeBase: knowledgeDocs,
      }
    );

    // 6. Save the assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        content: responseText,
        role: "assistant",
        mediaType: "text",
        conversationId,
      },
    });

    // 7. Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 8. Return the response
    return NextResponse.json({
      response: responseText,
      messageId: assistantMessage.id,
      conversationId,
    });
  } catch (error) {
    console.error("[Chat API] Error processing chat message:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
