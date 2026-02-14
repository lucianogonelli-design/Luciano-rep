import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Listar pacientes com busca e filtro
export async function GET(request: NextRequest) {
  try {
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
      return NextResponse.json(
        { error: "Nenhum doutor encontrado. Configure o sistema primeiro." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filtro de busca por nome ou telefone
    const where = {
      doctorId: doctor.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              appointments: true,
              conversations: true,
            },
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar pacientes:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar pacientes." },
      { status: 500 }
    );
  }
}

// Criar novo paciente
export async function POST(request: NextRequest) {
  try {
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
      return NextResponse.json(
        { error: "Nenhum doutor encontrado. Configure o sistema primeiro." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, phone, cpf, dateOfBirth, gender, address, notes, tags } = body;

    // Validar campos obrigatorios
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nome e telefone sao obrigatorios." },
        { status: 400 }
      );
    }

    // Verificar se ja existe paciente com mesmo telefone para este doutor
    const existingPatient = await prisma.patient.findFirst({
      where: {
        phone,
        doctorId: doctor.id,
      },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: "Ja existe um paciente com este telefone." },
        { status: 409 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        cpf,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        notes,
        tags,
        doctorId: doctor.id,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar paciente." },
      { status: 500 }
    );
  }
}
