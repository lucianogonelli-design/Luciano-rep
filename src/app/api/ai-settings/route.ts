import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Buscar configuracoes de IA do doutor
export async function GET() {
  try {
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
      return NextResponse.json(
        { error: "Nenhum doutor encontrado. Configure o sistema primeiro." },
        { status: 404 }
      );
    }

    // Buscar configuracoes existentes ou retornar valores padrao
    let settings = await prisma.aISettings.findUnique({
      where: { doctorId: doctor.id },
    });

    // Se nao existem configuracoes, criar com valores padrao
    if (!settings) {
      settings = await prisma.aISettings.create({
        data: {
          doctorId: doctor.id,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configuracoes de IA:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar configuracoes de IA." },
      { status: 500 }
    );
  }
}

// Atualizar configuracoes de IA
export async function PUT(request: NextRequest) {
  try {
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
      return NextResponse.json(
        { error: "Nenhum doutor encontrado. Configure o sistema primeiro." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      provider,
      model,
      systemPrompt,
      greeting,
      schedulingEnabled,
      autoReply,
      businessHoursOnly,
      businessHoursStart,
      businessHoursEnd,
      businessDays,
      maxTokens,
      temperature,
    } = body;

    // Validar provider se fornecido
    if (provider) {
      const validProviders = ["openai", "anthropic"];
      if (!validProviders.includes(provider)) {
        return NextResponse.json(
          { error: `Provider invalido. Valores permitidos: ${validProviders.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validar temperature se fornecida (entre 0 e 2)
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      return NextResponse.json(
        { error: "Temperature deve estar entre 0 e 2." },
        { status: 400 }
      );
    }

    // Validar maxTokens se fornecido
    if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 4096)) {
      return NextResponse.json(
        { error: "maxTokens deve estar entre 1 e 4096." },
        { status: 400 }
      );
    }

    // Upsert - criar se nao existe, atualizar se existe
    const settings = await prisma.aISettings.upsert({
      where: { doctorId: doctor.id },
      update: {
        ...(provider !== undefined && { provider }),
        ...(model !== undefined && { model }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(greeting !== undefined && { greeting }),
        ...(schedulingEnabled !== undefined && { schedulingEnabled }),
        ...(autoReply !== undefined && { autoReply }),
        ...(businessHoursOnly !== undefined && { businessHoursOnly }),
        ...(businessHoursStart !== undefined && { businessHoursStart }),
        ...(businessHoursEnd !== undefined && { businessHoursEnd }),
        ...(businessDays !== undefined && { businessDays }),
        ...(maxTokens !== undefined && { maxTokens }),
        ...(temperature !== undefined && { temperature }),
      },
      create: {
        doctorId: doctor.id,
        provider: provider || "openai",
        model: model || "gpt-4o-mini",
        systemPrompt: systemPrompt || "",
        greeting: greeting || "Ola! Sou o assistente virtual do consultorio. Como posso ajuda-lo?",
        schedulingEnabled: schedulingEnabled ?? true,
        autoReply: autoReply ?? true,
        businessHoursOnly: businessHoursOnly ?? false,
        businessHoursStart: businessHoursStart || "08:00",
        businessHoursEnd: businessHoursEnd || "18:00",
        businessDays: businessDays || "1,2,3,4,5",
        maxTokens: maxTokens || 500,
        temperature: temperature || 0.7,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao atualizar configuracoes de IA:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar configuracoes de IA." },
      { status: 500 }
    );
  }
}
