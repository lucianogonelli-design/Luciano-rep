"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Patient {
  id: string;
  name: string;
  phone: string;
}

interface PatientsResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function NewAppointmentPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [type, setType] = useState("consultation");
  const [notes, setNotes] = useState("");

  // Fetch patients for the dropdown
  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await fetch("/api/patients?limit=200");
        if (!response.ok) throw new Error("Erro ao carregar pacientes.");
        const data: PatientsResponse = await response.json();
        setPatients(data.patients);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar pacientes.");
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!patientId) {
      setError("Selecione um paciente.");
      return;
    }
    if (!date || !time) {
      setError("Data e horario sao obrigatorios.");
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time into a single ISO datetime string
      const dateTime = new Date(`${date}T${time}:00`).toISOString();

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          date: dateTime,
          duration: parseInt(duration, 10),
          type,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar agendamento.");
      }

      const appointment = await response.json();
      router.push(`/appointments/${appointment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/appointments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Consulta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Agende uma nova consulta para um paciente.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Dados do Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Patient select */}
            <div>
              <Select
                label="Paciente *"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={loadingPatients}
              >
                <option value="">
                  {loadingPatients
                    ? "Carregando pacientes..."
                    : "Selecione um paciente"}
                </option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </Select>
              {patients.length === 0 && !loadingPatients && (
                <p className="mt-1 text-sm text-gray-500">
                  Nenhum paciente cadastrado.{" "}
                  <Link
                    href="/patients/new"
                    className="text-primary-600 hover:underline"
                  >
                    Cadastre um paciente primeiro.
                  </Link>
                </p>
              )}
            </div>

            {/* Date and time */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Data *"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <Input
                label="Horario *"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            {/* Duration and type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Duracao"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
              </Select>
              <Select
                label="Tipo"
                value={type}
                onChange={(e) => setType(e.target.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informacoes adicionais sobre a consulta..."
              rows={4}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              <Link href="/appointments">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar Consulta
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
