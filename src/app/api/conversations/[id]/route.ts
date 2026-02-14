import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Buscar conversa por ID com mensagens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const messagesLimit = parseInt(searchParams.get("messagesLimit") || "50");

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        messages: {
          orderBy: { timestamp: "asc" },
          take: messagesLimit,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa nao encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Erro ao buscar conversa:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar conversa." },
      { status: 500 }
    );
  }
}

// Atualizar status da conversa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, patientId } = body;

    // Verificar se a conversa existe
    const existingConversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!existingConversation) {
      return NextResponse.json(
        { error: "Conversa nao encontrada." },
        { status: 404 }
      );
    }

    // Validar status se fornecido
    const validStatuses = ["active", "waiting", "resolved", "escalated"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status invalido. Valores permitidos: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Se patientId foi fornecido, verificar se o paciente existe
    if (patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Paciente nao encontrado." },
          { status: 404 }
        );
      }
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(patientId !== undefined && { patientId }),
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Erro ao atualizar conversa:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar conversa." },
      { status: 500 }
    );
  }
}
