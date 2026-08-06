import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a demo doctor
  const doctor = await prisma.doctor.upsert({
    where: { email: "dr.silva@exemplo.com" },
    update: {},
    create: {
      name: "Dr. Carlos Silva",
      email: "dr.silva@exemplo.com",
      phone: "11999990000",
      specialty: "Clínico Geral",
      crm: "CRM/SP 123456",
      clinicName: "Clínica Saúde & Vida",
      clinicAddress: "Av. Paulista, 1000 - São Paulo, SP",
    },
  });

  // Create AI settings
  await prisma.aISettings.upsert({
    where: { doctorId: doctor.id },
    update: {},
    create: {
      doctorId: doctor.id,
      provider: "openai",
      model: "gpt-4o-mini",
      systemPrompt: `Você é o assistente virtual da ${doctor.clinicName || "clínica"}.
Seu papel é ajudar pacientes com agendamentos, tirar dúvidas gerais e encaminhar questões médicas ao doutor.
Regras:
- Seja sempre educado e profissional
- NUNCA faça diagnósticos ou recomendações médicas
- Ajude com agendamento de consultas
- Para urgências, oriente a ir ao pronto-socorro
- Confirme dados antes de agendar`,
      greeting:
        "Olá! Sou o assistente virtual da Clínica Saúde & Vida. Como posso ajudá-lo hoje?",
    },
  });

  // Create demo patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: "Maria Oliveira",
        email: "maria@email.com",
        phone: "5511988881111",
        cpf: "12345678901",
        dateOfBirth: new Date("1985-03-15"),
        gender: "F",
        address: "Rua Augusta, 500 - São Paulo, SP",
        tags: "diabetes,retorno",
        doctorId: doctor.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: "João Santos",
        email: "joao@email.com",
        phone: "5511977772222",
        cpf: "98765432100",
        dateOfBirth: new Date("1990-07-22"),
        gender: "M",
        address: "Av. Brasil, 200 - São Paulo, SP",
        tags: "novo",
        doctorId: doctor.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Ana Costa",
        email: "ana@email.com",
        phone: "5511966663333",
        dateOfBirth: new Date("1978-11-08"),
        gender: "F",
        address: "Rua Oscar Freire, 300 - São Paulo, SP",
        tags: "hipertensão,acompanhamento",
        doctorId: doctor.id,
      },
    }),
  ]);

  // Create demo appointments
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 0, 0, 0);

  await Promise.all([
    prisma.appointment.create({
      data: {
        date: tomorrow,
        duration: 30,
        status: "confirmed",
        type: "follow_up",
        notes: "Retorno para verificar exames de diabetes",
        patientId: patients[0].id,
        doctorId: doctor.id,
      },
    }),
    prisma.appointment.create({
      data: {
        date: dayAfter,
        duration: 45,
        status: "scheduled",
        type: "consultation",
        notes: "Primeira consulta",
        patientId: patients[1].id,
        doctorId: doctor.id,
      },
    }),
  ]);

  // Create demo medical records
  await Promise.all([
    prisma.medicalRecord.create({
      data: {
        date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        type: "consultation",
        title: "Consulta de rotina - Diabetes",
        content:
          "Paciente relata estar seguindo dieta. Glicemia de jejum: 110 mg/dL. Hemoglobina glicada: 6.8%.",
        prescription: "Metformina 850mg - 1x ao dia após almoço",
        patientId: patients[0].id,
      },
    }),
    prisma.medicalRecord.create({
      data: {
        date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        type: "exam",
        title: "Resultado de exames laboratoriais",
        content:
          "Hemograma completo normal. Glicemia de jejum: 125 mg/dL (acima do normal). Colesterol total: 195 mg/dL.",
        patientId: patients[0].id,
      },
    }),
  ]);

  // Create a demo conversation
  const conversation = await prisma.conversation.create({
    data: {
      whatsappPhone: "5511988881111",
      status: "resolved",
      patientId: patients[0].id,
    },
  });

  await Promise.all([
    prisma.message.create({
      data: {
        content: "Olá, gostaria de agendar uma consulta de retorno",
        role: "user",
        conversationId: conversation.id,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.message.create({
      data: {
        content:
          "Olá Maria! Claro, vou verificar os horários disponíveis para seu retorno. O Dr. Carlos tem disponibilidade amanhã às 9h ou às 14h. Qual horário prefere?",
        role: "assistant",
        conversationId: conversation.id,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 5000),
      },
    }),
    prisma.message.create({
      data: {
        content: "Amanhã às 9h está ótimo!",
        role: "user",
        conversationId: conversation.id,
        timestamp: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      },
    }),
    prisma.message.create({
      data: {
        content:
          "Perfeito! Sua consulta de retorno com o Dr. Carlos foi agendada para amanhã às 9h. Lembre-se de trazer seus exames recentes. Até lá!",
        role: "assistant",
        conversationId: conversation.id,
        timestamp: new Date(now.getTime() - 1.5 * 60 * 60 * 1000 + 5000),
      },
    }),
  ]);

  console.log("Seed completed successfully!");
  console.log(`Doctor: ${doctor.name} (${doctor.email})`);
  console.log(`Patients: ${patients.length} created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
