import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Buscar paciente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { date: "desc" },
          take: 10,
        },
        medicalRecords: {
          orderBy: { date: "desc" },
          take: 10,
        },
        conversations: {
          orderBy: { updatedAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            appointments: true,
            medicalRecords: true,
            conversations: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente nao encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Erro ao buscar paciente:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar paciente." },
      { status: 500 }
    );
  }
}

// Atualizar paciente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, cpf, dateOfBirth, gender, address, notes, tags } = body;

    // Verificar se o paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Paciente nao encontrado." },
        { status: 404 }
      );
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(cpf !== undefined && { cpf }),
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar paciente." },
      { status: 500 }
    );
  }
}

// Deletar paciente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Paciente nao encontrado." },
        { status: 404 }
      );
    }

    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Paciente deletado com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar paciente:", error);
    return NextResponse.json(
      { error: "Erro interno ao deletar paciente." },
      { status: 500 }
    );
  }
}
