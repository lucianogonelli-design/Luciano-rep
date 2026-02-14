import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Listar mensagens de uma conversa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Verificar se a conversa existe
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa nao encontrada." },
        { status: 404 }
      );
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { timestamp: "asc" },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: { conversationId: id },
      }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar mensagens:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar mensagens." },
      { status: 500 }
    );
  }
}

// Criar nova mensagem em uma conversa
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, role, mediaType, mediaUrl, metadata } = body;

    // Validar campos obrigatorios
    if (!content || !role) {
      return NextResponse.json(
        { error: "Conteudo e role sao obrigatorios." },
        { status: 400 }
      );
    }

    // Validar role
    const validRoles = ["user", "assistant", "system"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Role invalido. Valores permitidos: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Verificar se a conversa existe
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa nao encontrada." },
        { status: 404 }
      );
    }

    // Criar mensagem e atualizar timestamp da conversa
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          role,
          mediaType: mediaType || "text",
          mediaUrl,
          metadata: metadata ? JSON.stringify(metadata) : null,
          conversationId: id,
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: {
          updatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar mensagem:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar mensagem." },
      { status: 500 }
    );
  }
}
