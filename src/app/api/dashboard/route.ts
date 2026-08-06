import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Obter estatisticas do dashboard
export async function GET(request: NextRequest) {
  try {
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
      return NextResponse.json(
        { error: "Nenhum doutor encontrado. Configure o sistema primeiro." },
        { status: 404 }
      );
    }

    // Datas para filtros
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Inicio da semana (domingo)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Executar todas as consultas em paralelo para melhor performance
    const [
      totalPatients,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      activeConversations,
      waitingConversations,
      escalatedConversations,
      recentPatients,
      upcomingAppointments,
      appointmentsByStatus,
    ] = await Promise.all([
      // Total de pacientes
      prisma.patient.count({
        where: { doctorId: doctor.id },
      }),

      // Agendamentos de hoje
      prisma.appointment.count({
        where: {
          doctorId: doctor.id,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Agendamentos da semana
      prisma.appointment.count({
        where: {
          doctorId: doctor.id,
          date: {
            gte: weekStart,
            lte: todayEnd,
          },
        },
      }),

      // Agendamentos do mes
      prisma.appointment.count({
        where: {
          doctorId: doctor.id,
          date: {
            gte: monthStart,
            lte: todayEnd,
          },
        },
      }),

      // Conversas ativas
      prisma.conversation.count({
        where: { status: "active" },
      }),

      // Conversas aguardando
      prisma.conversation.count({
        where: { status: "waiting" },
      }),

      // Conversas escaladas (precisam de atencao)
      prisma.conversation.count({
        where: { status: "escalated" },
      }),

      // Pacientes recentes (ultimos 5 cadastrados)
      prisma.patient.findMany({
        where: { doctorId: doctor.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      }),

      // Proximos agendamentos (hoje e futuros, limite 10)
      prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          date: { gte: todayStart },
          status: { in: ["scheduled", "confirmed"] },
        },
        orderBy: { date: "asc" },
        take: 10,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),

      // Contagem de agendamentos por status (hoje)
      prisma.appointment.groupBy({
        by: ["status"],
        where: {
          doctorId: doctor.id,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Formatar contagem por status
    const statusCounts = appointmentsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      stats: {
        totalPatients,
        todayAppointments,
        weekAppointments,
        monthAppointments,
        activeConversations,
        waitingConversations,
        escalatedConversations,
        todayAppointmentsByStatus: statusCounts,
      },
      recentPatients,
      upcomingAppointments,
    });
  } catch (error) {
    console.error("Erro ao buscar estatisticas do dashboard:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar estatisticas." },
      { status: 500 }
    );
  }
}
