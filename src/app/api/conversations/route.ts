import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Listar conversas com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          messages: {
            orderBy: { timestamp: "desc" },
            take: 1, // Ultima mensagem para preview
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar conversas:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar conversas." },
      { status: 500 }
    );
  }
}

// Criar nova conversa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { whatsappPhone, patientId, source } = body;

    // Validar campo obrigatorio
    if (!whatsappPhone) {
      return NextResponse.json(
        { error: "Numero do WhatsApp eh obrigatorio." },
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

    const conversation = await prisma.conversation.create({
      data: {
        whatsappPhone,
        patientId: patientId || null,
        source: source || "whatsapp",
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

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar conversa:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar conversa." },
      { status: 500 }
    );
  }
}
