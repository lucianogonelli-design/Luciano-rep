"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, Plus, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  formatDate,
  formatTime,
  appointmentStatusLabels,
  appointmentStatusColors,
  appointmentTypeLabels,
} from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface Appointment {
  id: string;
  date: string;
  duration: number;
  status: string;
  type: string;
  notes: string | null;
  patient: Patient;
}

interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AppointmentsPage() {
  const router = useRouter();

  // Default to today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "50");

      const response = await fetch(`/api/appointments?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar agendamentos.");
      }

      const data: AppointmentsResponse = await response.json();
      setAppointments(data.appointments);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Group appointments by hour for a timeline-style display
  const groupedByHour = appointments.reduce<Record<string, Appointment[]>>(
    (groups, appointment) => {
      const hour = new Date(appointment.date).getHours().toString().padStart(2, "0") + ":00";
      if (!groups[hour]) {
        groups[hour] = [];
      }
      groups[hour].push(appointment);
      return groups;
    },
    {}
  );

  const sortedHours = Object.keys(groupedByHour).sort();

  // Status border color for left accent
  const statusBorderColors: Record<string, string> = {
    scheduled: "border-l-blue-500",
    confirmed: "border-l-green-500",
    completed: "border-l-gray-400",
    cancelled: "border-l-red-500",
    no_show: "border-l-yellow-500",
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as consultas e agendamentos do dia.
          </p>
        </div>
        <Link href="/appointments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Consulta
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 max-w-xs">
              <Input
                label="Data"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex-1 max-w-xs">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="scheduled">Agendada</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Concluida</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">Nao compareceu</option>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                {pagination.total}{" "}
                {pagination.total === 1 ? "agendamento" : "agendamentos"}
                {selectedDate && (
                  <> para {formatDate(selectedDate + "T12:00:00")}</>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">{error}</p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={fetchAppointments}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && appointments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Nenhum agendamento encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Nao ha agendamentos para os filtros selecionados.
              </p>
              <Link href="/appointments/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Agendar nova consulta
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments timeline / list */}
      {!loading && !error && appointments.length > 0 && (
        <div className="space-y-6">
          {sortedHours.map((hour) => (
            <div key={hour}>
              {/* Hour label */}
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-500">
                  {hour}
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Appointment cards for this hour */}
              <div className="space-y-3 pl-6">
                {groupedByHour[hour]
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((appointment) => (
                    <Card
                      key={appointment.id}
                      className={`cursor-pointer border-l-4 transition-shadow hover:shadow-md ${
                        statusBorderColors[appointment.status] ||
                        "border-l-gray-300"
                      }`}
                      onClick={() =>
                        router.push(`/appointments/${appointment.id}`)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: appointment info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatTime(appointment.date)}
                              </span>
                              <Badge
                                className={
                                  appointmentStatusColors[appointment.status] ||
                                  ""
                                }
                              >
                                {appointmentStatusLabels[appointment.status] ||
                                  appointment.status}
                              </Badge>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-800">
                                {appointment.patient.name}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span>
                                {appointmentTypeLabels[appointment.type] ||
                                  appointment.type}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {appointment.duration} min
                              </span>
                            </div>

                            {appointment.notes && (
                              <p className="mt-2 text-sm text-gray-500 line-clamp-1">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
