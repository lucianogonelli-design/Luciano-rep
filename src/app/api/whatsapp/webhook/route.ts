import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWhatsAppService } from "@/lib/whatsapp";
import { processMessage } from "@/lib/ai-agent";

// ---------------------------------------------------------------------------
// GET — Webhook verification (Meta sends hub.mode, hub.verify_token,
// hub.challenge when registering or re-verifying a webhook)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Verification failed — token mismatch");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Receive incoming messages from Meta
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Meta always sends an "object" field set to "whatsapp_business_account"
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Iterate through each entry and each change
    const entries = body.entry ?? [];

    for (const entry of entries) {
      const changes = entry.changes ?? [];

      for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value;
        if (!value?.messages || value.messages.length === 0) continue;

        const contacts = value.contacts ?? [];
        const messages = value.messages;

        for (const incomingMessage of messages) {
          // We only handle text messages for now
          if (incomingMessage.type !== "text") continue;

          const fromPhone: string = incomingMessage.from; // sender phone
          const messageText: string = incomingMessage.text?.body ?? "";
          const messageId: string = incomingMessage.id;
          const contactName: string =
            contacts.find(
              (c: { wa_id: string; profile?: { name?: string } }) =>
                c.wa_id === fromPhone
            )?.profile?.name ?? "Paciente";

          // Mark message as read asynchronously (best-effort)
          try {
            const whatsapp = getWhatsAppService();
            await whatsapp.markAsRead(messageId);
          } catch (err) {
            console.error(
              "[WhatsApp Webhook] Failed to mark message as read:",
              err
            );
          }

          await handleIncomingMessage(
            fromPhone,
            contactName,
            messageText
          );
        }
      }
    }

    // Always return 200 to Meta so they don't retry
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing webhook:", error);
    // Return 200 even on errors to prevent Meta from retrying indefinitely
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// Core handler — processes one incoming message
// ---------------------------------------------------------------------------

async function handleIncomingMessage(
  phone: string,
  contactName: string,
  messageText: string
) {
  try {
    // 1. Find or create patient by phone number
    //    We assume a single-doctor setup for simplicity — grab the first doctor.
    const doctor = await prisma.doctor.findFirst({
      include: { aiSettings: true },
    });

    if (!doctor) {
      console.error(
        "[WhatsApp Webhook] No doctor found in the database. Ignoring message."
      );
      return;
    }

    let patient = await prisma.patient.findFirst({
      where: { phone, doctorId: doctor.id },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: contactName,
          phone,
          doctorId: doctor.id,
        },
      });
      console.log(
        `[WhatsApp Webhook] Created new patient: ${patient.id} (${contactName})`
      );
    }

    // 2. Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        whatsappPhone: phone,
        status: { in: ["active", "waiting"] },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          whatsappPhone: phone,
          patientId: patient.id,
          status: "active",
          source: "whatsapp",
        },
      });
      console.log(
        `[WhatsApp Webhook] Created new conversation: ${conversation.id}`
      );
    }

    // 3. Save the incoming message
    await prisma.message.create({
      data: {
        content: messageText,
        role: "user",
        mediaType: "text",
        conversationId: conversation.id,
      },
    });

    // 4. Load AI settings
    const aiSettings = doctor.aiSettings;

    if (!aiSettings || !aiSettings.autoReply) {
      console.log(
        "[WhatsApp Webhook] Auto-reply disabled. Message saved but no response sent."
      );

      // Update conversation status to waiting so a human can pick it up
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: "waiting" },
      });

      return;
    }

    // 5. Check business hours if configured
    if (aiSettings.businessHoursOnly) {
      const now = new Date();
      const currentDay = now.getDay(); // 0-6
      const businessDays = aiSettings.businessDays
        .split(",")
        .map((d) => parseInt(d.trim(), 10));

      if (!businessDays.includes(currentDay)) {
        console.log(
          "[WhatsApp Webhook] Outside business days. Skipping auto-reply."
        );
        return;
      }

      const [startH, startM] = aiSettings.businessHoursStart
        .split(":")
        .map(Number);
      const [endH, endM] = aiSettings.businessHoursEnd
        .split(":")
        .map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        console.log(
          "[WhatsApp Webhook] Outside business hours. Skipping auto-reply."
        );
        return;
      }
    }

    // 6. Load conversation history
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { timestamp: "asc" },
      take: 50, // limit context window
    });

    const conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 7. Load knowledge base (RAG)
    const knowledgeDocs = await prisma.knowledgeBase.findMany({
      where: { doctorId: doctor.id, isActive: true },
      select: { category: true, title: true, content: true },
    });

    // 8. Call the AI agent
    const responseText = await processMessage(
      messageText,
      conversationHistory,
      {
        provider: aiSettings.provider as "openai" | "anthropic",
        model: aiSettings.model,
        systemPrompt: aiSettings.systemPrompt,
        maxTokens: aiSettings.maxTokens,
        temperature: aiSettings.temperature,
        schedulingEnabled: aiSettings.schedulingEnabled,
        clinicName: doctor.clinicName ?? undefined,
        clinicAddress: doctor.clinicAddress ?? undefined,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        knowledgeBase: knowledgeDocs,
      }
    );

    // 8. Save the AI response message
    await prisma.message.create({
      data: {
        content: responseText,
        role: "assistant",
        mediaType: "text",
        conversationId: conversation.id,
      },
    });

    // 9. Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // 10. Send the response back via WhatsApp
    try {
      const whatsapp = getWhatsAppService();
      await whatsapp.sendMessage(phone, responseText);
    } catch (err) {
      console.error(
        "[WhatsApp Webhook] Failed to send WhatsApp response:",
        err
      );
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling message:", error);
  }
}
