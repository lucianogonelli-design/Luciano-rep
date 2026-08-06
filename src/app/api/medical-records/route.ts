import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Listar prontuarios por paciente (patientId obrigatorio)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // patientId eh obrigatorio
    if (!patientId) {
      return NextResponse.json(
        { error: "O parametro patientId eh obrigatorio." },
        { status: 400 }
      );
    }

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente nao encontrado." },
        { status: 404 }
      );
    }

    // Construir filtros
    const where: Record<string, unknown> = {
      patientId,
    };

    if (type) {
      where.type = type;
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar prontuarios:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar prontuarios." },
      { status: 500 }
    );
  }
}

// Criar novo prontuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, date, type, title, content, prescription, attachments } = body;

    // Validar campos obrigatorios
    if (!patientId || !title || !content) {
      return NextResponse.json(
        { error: "Paciente, titulo e conteudo sao obrigatorios." },
        { status: 400 }
      );
    }

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente nao encontrado." },
        { status: 404 }
      );
    }

    const record = await prisma.medicalRecord.create({
      data: {
        date: date ? new Date(date) : new Date(),
        type: type || "consultation",
        title,
        content,
        prescription,
        attachments: attachments ? JSON.stringify(attachments) : null,
        patientId,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar prontuario:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar prontuario." },
      { status: 500 }
    );
  }
}
