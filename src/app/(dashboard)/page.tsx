"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Calendar, MessageSquare, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatDateTime,
  appointmentStatusLabels,
  appointmentStatusColors,
  conversationStatusLabels,
  conversationStatusColors,
} from "@/lib/utils";

interface DashboardData {
  totalPatients: number;
  todayAppointments: number;
  activeConversations: number;
  weekAppointments: number;
  upcomingAppointments: Array<{
    id: string;
    date: string;
    status: string;
    type: string;
    patient: { id: string; name: string; phone: string };
  }>;
  recentConversations: Array<{
    id: string;
    status: string;
    whatsappPhone: string;
    updatedAt: string;
    patient: { id: string; name: string } | null;
    messages: Array<{ content: string; role: string; timestamp: string }>;
  }>;
}

function StatCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-8 w-16 rounded bg-gray-200" />
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-48 rounded bg-gray-200" />
          </div>
          <div className="h-5 w-16 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Falha ao carregar dados do dashboard");
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro desconhecido"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const statCards = [
    {
      title: "Total de Pacientes",
      value: data?.totalPatients ?? 0,
      icon: Users,
      borderColor: "border-l-blue-500",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      href: "/patients",
    },
    {
      title: "Consultas Hoje",
      value: data?.todayAppointments ?? 0,
      icon: Calendar,
      borderColor: "border-l-green-500",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      href: "/appointments",
    },
    {
      title: "Conversas Ativas",
      value: data?.activeConversations ?? 0,
      icon: MessageSquare,
      borderColor: "border-l-orange-500",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      href: "/conversations",
    },
    {
      title: "Consultas da Semana",
      value: data?.weekAppointments ?? 0,
      icon: Activity,
      borderColor: "border-l-purple-500",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      href: "/appointments",
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Activity className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Erro ao carregar dashboard
            </h3>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetch("/api/dashboard")
                  .then((res) => {
                    if (!res.ok) throw new Error("Falha ao carregar dados");
                    return res.json();
                  })
                  .then(setData)
                  .catch((err) =>
                    setError(
                      err instanceof Error ? err.message : "Erro desconhecido"
                    )
                  )
                  .finally(() => setLoading(false));
              }}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visão geral do seu consultório
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href}>
                  <Card
                    className={`border-l-4 ${card.borderColor} hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            {card.title}
                          </p>
                          <p className="mt-1 text-3xl font-bold text-gray-900">
                            {card.value}
                          </p>
                        </div>
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${card.iconBg}`}
                        >
                          <Icon className={`h-6 w-6 ${card.iconColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Próximas Consultas
            </CardTitle>
            <Link
              href="/appointments"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ListSkeleton />
            ) : !data?.upcomingAppointments?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  Nenhuma consulta agendada
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Novas consultas aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.upcomingAppointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/appointments/${appointment.id}`}
                    className="block rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {appointment.patient.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatDateTime(appointment.date)}
                          {" — "}
                          <span className="capitalize">
                            {appointment.type}
                          </span>
                        </p>
                      </div>
                      <Badge
                        className={
                          appointmentStatusColors[appointment.status] ??
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {appointmentStatusLabels[appointment.status] ??
                          appointment.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              Conversas Recentes
            </CardTitle>
            <Link
              href="/conversations"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ListSkeleton />
            ) : !data?.recentConversations?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  Nenhuma conversa recente
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Conversas via WhatsApp aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.recentConversations.map((conversation) => {
                  const lastMessage = conversation.messages?.[0];
                  const displayName =
                    conversation.patient?.name ?? conversation.whatsappPhone;

                  return (
                    <Link
                      key={conversation.id}
                      href={`/conversations/${conversation.id}`}
                      className="block rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {displayName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {lastMessage
                              ? lastMessage.content
                              : "Sem mensagens"}
                          </p>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-1">
                          <Badge
                            className={
                              conversationStatusColors[conversation.status] ??
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {conversationStatusLabels[conversation.status] ??
                              conversation.status}
                          </Badge>
                          <span className="text-[10px] text-gray-400">
                            {formatDateTime(conversation.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
