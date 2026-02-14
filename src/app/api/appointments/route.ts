import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Listar agendamentos com filtros por data e status
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
    const date = searchParams.get("date"); // formato: YYYY-MM-DD
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Construir filtros dinamicamente
    const where: Record<string, unknown> = {
      doctorId: doctor.id,
    };

    // Filtro por data especifica (inicio e fim do dia)
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por paciente
    if (patientId) {
      where.patientId = patientId;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { date: "asc" },
        skip,
        take: limit,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar agendamentos." },
      { status: 500 }
    );
  }
}

// Criar novo agendamento
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
    const { patientId, date, duration, type, notes } = body;

    // Validar campos obrigatorios
    if (!patientId || !date) {
      return NextResponse.json(
        { error: "Paciente e data sao obrigatorios." },
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

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        duration: duration || 30,
        type: type || "consultation",
        notes,
        patientId,
        doctorId: doctor.id,
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

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar agendamento." },
      { status: 500 }
    );
  }
}
