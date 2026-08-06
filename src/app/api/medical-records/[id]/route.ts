import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Buscar prontuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Prontuario nao encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Erro ao buscar prontuario:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar prontuario." },
      { status: 500 }
    );
  }
}

// Atualizar prontuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, type, title, content, prescription, attachments } = body;

    // Verificar se o prontuario existe
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Prontuario nao encontrado." },
        { status: 404 }
      );
    }

    const record = await prisma.medicalRecord.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(prescription !== undefined && { prescription }),
        ...(attachments !== undefined && {
          attachments: attachments ? JSON.stringify(attachments) : null,
        }),
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

    return NextResponse.json(record);
  } catch (error) {
    console.error("Erro ao atualizar prontuario:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar prontuario." },
      { status: 500 }
    );
  }
}

// Deletar prontuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Prontuario nao encontrado." },
        { status: 404 }
      );
    }

    await prisma.medicalRecord.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Prontuario deletado com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar prontuario:", error);
    return NextResponse.json(
      { error: "Erro interno ao deletar prontuario." },
      { status: 500 }
    );
  }
}
