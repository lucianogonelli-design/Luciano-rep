"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Check,
  X,
  User,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  formatDate,
  formatTime,
  formatDateTime,
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

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

interface Appointment {
  id: string;
  date: string;
  duration: number;
  status: string;
  type: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: Patient;
  doctor: Doctor;
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState("30");
  const [editType, setEditType] = useState("consultation");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status update loading
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchAppointment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Agendamento nao encontrado.");
        }
        throw new Error("Erro ao carregar agendamento.");
      }

      const data: Appointment = await response.json();
      setAppointment(data);

      // Initialize edit form fields
      const dateObj = new Date(data.date);
      setEditDate(dateObj.toISOString().split("T")[0]);
      setEditTime(
        dateObj.getHours().toString().padStart(2, "0") +
          ":" +
          dateObj.getMinutes().toString().padStart(2, "0")
      );
      setEditDuration(data.duration.toString());
      setEditType(data.type);
      setEditNotes(data.notes || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // Update status
  async function handleStatusUpdate(newStatus: string) {
    if (!appointment) return;
    setUpdatingStatus(true);

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar status.");
      }

      // Refetch to get updated data
      await fetchAppointment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Save edits
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!appointment) return;
    setSaving(true);
    setError(null);

    try {
      const dateTime = new Date(`${editDate}T${editTime}:00`).toISOString();

      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateTime,
          duration: parseInt(editDuration, 10),
          type: editType,
          notes: editNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar alteracoes.");
      }

      setEditing(false);
      await fetchAppointment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar alteracoes.");
    } finally {
      setSaving(false);
    }
  }

  // Delete appointment
  async function handleDelete() {
    setDeleting(true);

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao excluir agendamento.");
      }

      router.push("/appointments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir agendamento.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  // Cancel edit mode
  function handleCancelEdit() {
    if (appointment) {
      const dateObj = new Date(appointment.date);
      setEditDate(dateObj.toISOString().split("T")[0]);
      setEditTime(
        dateObj.getHours().toString().padStart(2, "0") +
          ":" +
          dateObj.getMinutes().toString().padStart(2, "0")
      );
      setEditDuration(appointment.duration.toString());
      setEditType(appointment.type);
      setEditNotes(appointment.notes || "");
    }
    setEditing(false);
    setError(null);
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  // Error with no appointment data (not found)
  if (!appointment) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/appointments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Agendamento nao encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {error || "O agendamento solicitado nao existe ou foi removido."}
              </p>
              <Link href="/appointments" className="mt-4">
                <Button variant="outline">Ver todos os agendamentos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/appointments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalhes do Agendamento
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatDateTime(appointment.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status actions */}
      {!editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status do Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={`text-sm px-3 py-1 ${
                  appointmentStatusColors[appointment.status] || ""
                }`}
              >
                {appointmentStatusLabels[appointment.status] ||
                  appointment.status}
              </Badge>

              <div className="h-6 w-px bg-gray-200" />

              {/* Status action buttons - show based on current status */}
              {appointment.status === "scheduled" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("confirmed")}
                  disabled={updatingStatus}
                >
                  <Check className="mr-1.5 h-4 w-4 text-green-600" />
                  Confirmar
                </Button>
              )}

              {(appointment.status === "scheduled" ||
                appointment.status === "confirmed") && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={updatingStatus}
                  >
                    <Check className="mr-1.5 h-4 w-4 text-gray-600" />
                    Concluir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={updatingStatus}
                  >
                    <X className="mr-1.5 h-4 w-4 text-red-600" />
                    Cancelar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate("no_show")}
                    disabled={updatingStatus}
                  >
                    <User className="mr-1.5 h-4 w-4 text-yellow-600" />
                    Nao compareceu
                  </Button>
                </>
              )}

              {updatingStatus && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment details or edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            {editing ? "Editar Agendamento" : "Informacoes da Consulta"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            /* Edit form */
            <form onSubmit={handleSave} className="space-y-5">
              {/* Date and time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Data *"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
                <Input
                  label="Horario *"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                />
              </div>

              {/* Duration and type */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Duracao"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                </Select>
                <Select
                  label="Tipo"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                >
                  <option value="consultation">Consulta</option>
                  <option value="follow_up">Retorno</option>
                  <option value="exam">Exame</option>
                  <option value="procedure">Procedimento</option>
                </Select>
              </div>

              {/* Notes */}
              <Textarea
                label="Observacoes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Informacoes adicionais sobre a consulta..."
                rows={4}
              />

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Salvar Alteracoes
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* Detail view */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Date */}
                <div>
                  <p className="text-sm font-medium text-gray-500">Data</p>
                  <p className="mt-1 flex items-center gap-2 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(appointment.date)}
                  </p>
                </div>

                {/* Time */}
                <div>
                  <p className="text-sm font-medium text-gray-500">Horario</p>
                  <p className="mt-1 flex items-center gap-2 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formatTime(appointment.date)}
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-sm font-medium text-gray-500">Duracao</p>
                  <p className="mt-1 text-gray-900">
                    {appointment.duration} minutos
                  </p>
                </div>

                {/* Type */}
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="mt-1 text-gray-900">
                    {appointmentTypeLabels[appointment.type] ||
                      appointment.type}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Observacoes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-gray-900">
                    {appointment.notes}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-500 sm:grid-cols-2">
                  <p>Criado em: {formatDateTime(appointment.createdAt)}</p>
                  <p>
                    Atualizado em: {formatDateTime(appointment.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">
                {appointment.patient.name}
              </p>
              <div className="mt-1 space-y-0.5 text-sm text-gray-500">
                {appointment.patient.phone && (
                  <p>Telefone: {appointment.patient.phone}</p>
                )}
                {appointment.patient.email && (
                  <p>Email: {appointment.patient.email}</p>
                )}
              </div>
            </div>
            <Link href={`/patients/${appointment.patient.id}`}>
              <Button variant="outline" size="sm">
                <User className="mr-2 h-4 w-4" />
                Ver perfil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Doctor info card */}
      {appointment.doctor && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Profissional:</span>
              <span>
                {appointment.doctor.name} - {appointment.doctor.specialty}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Agendamento"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir este agendamento? Esta acao nao pode
            ser desfeita.
          </p>
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-900">
              {appointment.patient.name}
            </p>
            <p className="text-gray-500">
              {formatDate(appointment.date)} as{" "}
              {formatTime(appointment.date)} -{" "}
              {appointmentTypeLabels[appointment.type] || appointment.type}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
