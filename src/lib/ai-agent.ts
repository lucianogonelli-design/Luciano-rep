import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationMessage {
  role: string;
  content: string;
}

interface KnowledgeDocument {
  category: string;
  title: string;
  content: string;
}

interface AIAgentSettings {
  provider: "openai" | "anthropic";
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  schedulingEnabled?: boolean;
  clinicName?: string;
  clinicAddress?: string;
  doctorName?: string;
  specialty?: string;
  knowledgeBase?: KnowledgeDocument[];
}

// ---------------------------------------------------------------------------
// Tool implementations (mock)
// ---------------------------------------------------------------------------

function mockCheckAvailability(date: string): {
  date: string;
  availableSlots: string[];
} {
  // In a real implementation this would query the database for open slots.
  const slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

  // Simulate some slots being taken by removing a random subset.
  const available = slots.filter(() => Math.random() > 0.3);

  return {
    date,
    availableSlots: available.length > 0 ? available : ["14:00", "15:00"],
  };
}

function mockScheduleAppointment(
  patientName: string,
  date: string,
  time: string,
  type: string
): { success: boolean; confirmationId: string; message: string } {
  const confirmationId = `APT-${Date.now().toString(36).toUpperCase()}`;

  return {
    success: true,
    confirmationId,
    message: `Consulta agendada com sucesso para ${patientName} em ${date} às ${time}. Tipo: ${type}. Código de confirmação: ${confirmationId}`,
  };
}

function mockGetClinicInfo(settings: AIAgentSettings): {
  clinicName: string;
  address: string;
  doctor: string;
  specialty: string;
  businessHours: string;
} {
  return {
    clinicName: settings.clinicName ?? "Consultório Médico",
    address: settings.clinicAddress ?? "Endereço não configurado",
    doctor: settings.doctorName ?? "Dr(a). não configurado",
    specialty: settings.specialty ?? "Clínica Geral",
    businessHours: "Segunda a Sexta, 08:00 - 18:00",
  };
}

// ---------------------------------------------------------------------------
// Build system prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(settings: AIAgentSettings): string {
  const base = `Você é um assistente virtual médico do consultório ${
    settings.clinicName ?? "do doutor"
  }. Você auxilia pacientes com agendamento de consultas, informações sobre o consultório e dúvidas gerais.

Regras importantes:
- Seja educado, profissional e empático.
- Nunca forneça diagnósticos médicos, prescrições ou orientações clínicas específicas.
- Se o paciente descrever sintomas urgentes ou emergências, oriente-o a ligar para o SAMU (192) ou ir ao pronto-socorro mais próximo.
- Para questões clínicas, sempre recomende que o paciente agende uma consulta com o médico.
- Responda sempre em português brasileiro.
- Seja conciso e objetivo nas respostas.
- Quando o paciente quiser agendar, utilize a ferramenta de verificação de disponibilidade antes de confirmar.`;

  const custom = settings.systemPrompt?.trim();
  let prompt = custom ? `${base}\n\nInstruções adicionais do médico:\n${custom}` : base;

  // Injetar base de conhecimento (RAG) no contexto
  if (settings.knowledgeBase && settings.knowledgeBase.length > 0) {
    const knowledgeText = settings.knowledgeBase
      .map((doc) => `[${doc.category.toUpperCase()}] ${doc.title}:\n${doc.content}`)
      .join("\n\n---\n\n");

    prompt += `\n\n=== BASE DE CONHECIMENTO DA CLÍNICA ===
Use as informações abaixo para responder perguntas dos pacientes com precisão.
Se a resposta estiver na base de conhecimento, use essa informação.
Se não encontrar a resposta na base, responda de forma geral e sugira entrar em contato com a clínica.

${knowledgeText}

=== FIM DA BASE DE CONHECIMENTO ===`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function processMessage(
  message: string,
  conversationHistory: ConversationMessage[],
  settings: AIAgentSettings
): Promise<string> {
  // Choose the AI provider based on settings
  const model =
    settings.provider === "anthropic"
      ? anthropic(settings.model)
      : openai(settings.model);

  // Build message list for the AI
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const msg of conversationHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  // Append the current incoming message
  messages.push({ role: "user", content: message });

  // Define tools available to the AI
  const tools: Record<string, unknown> = {};

  if (settings.schedulingEnabled !== false) {
    tools.checkAvailability = {
      description:
        "Verifica os horários disponíveis para agendamento em uma data específica.",
      parameters: z.object({
        date: z
          .string()
          .describe(
            "A data para verificar disponibilidade no formato YYYY-MM-DD"
          ),
      }),
      execute: async ({ date }: { date: string }) => {
        return mockCheckAvailability(date);
      },
    };

    tools.scheduleAppointment = {
      description: "Agenda uma consulta para o paciente.",
      parameters: z.object({
        patientName: z.string().describe("Nome completo do paciente"),
        date: z
          .string()
          .describe("Data da consulta no formato YYYY-MM-DD"),
        time: z
          .string()
          .describe("Horário da consulta no formato HH:MM"),
        type: z
          .enum(["consultation", "follow_up", "exam", "procedure"])
          .describe("Tipo de consulta")
          .default("consultation"),
      }),
      execute: async ({
        patientName,
        date,
        time,
        type,
      }: {
        patientName: string;
        date: string;
        time: string;
        type: string;
      }) => {
        return mockScheduleAppointment(patientName, date, time, type);
      },
    };
  }

  tools.getClinicInfo = {
    description:
      "Retorna informações sobre o consultório, endereço, médico responsável e horário de funcionamento.",
    parameters: z.object({}),
    execute: async () => {
      return mockGetClinicInfo(settings);
    },
  };

  try {
    const result = await generateText({
      model: model as Parameters<typeof generateText>[0]["model"],
      system: buildSystemPrompt(settings),
      messages,
      tools: tools as Parameters<typeof generateText>[0]["tools"],
      maxTokens: settings.maxTokens ?? 500,
      temperature: settings.temperature ?? 0.7,
      maxSteps: 5,
    });

    return (
      result.text ||
      "Desculpe, não consegui processar sua mensagem. Por favor, tente novamente."
    );
  } catch (error) {
    console.error("[AI Agent] Error generating response:", error);
    throw new Error(
      `Failed to generate AI response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
