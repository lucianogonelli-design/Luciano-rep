import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Listar documentos da base de conhecimento
export async function GET(request: NextRequest) {
  try {
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
      return NextResponse.json({ error: "Médico não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { doctorId: doctor.id };

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    const documents = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Erro ao buscar base de conhecimento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar documentos" },
      { status: 500 }
    );
  }
}

// Criar novo documento
export async function POST(request: NextRequest) {
  try {
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
      return NextResponse.json({ error: "Médico não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { category, title, content, tags } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Categoria, título e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }

    const document = await prisma.knowledgeBase.create({
      data: {
        category,
        title,
        content,
        tags: tags || null,
        doctorId: doctor.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar documento:", error);
    return NextResponse.json(
      { error: "Erro ao criar documento" },
      { status: 500 }
    );
  }
}
