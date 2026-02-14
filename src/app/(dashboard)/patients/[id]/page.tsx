"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  Calendar,
  Plus,
  Save,
  X,
  MapPin,
  FileText,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDate,
  formatPhone,
  formatDateTime,
  appointmentStatusLabels,
  appointmentStatusColors,
  appointmentTypeLabels,
} from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  conversations: Conversation[];
  _count: {
    appointments: number;
    medicalRecords: number;
    conversations: number;
  };
}

interface MedicalRecord {
  id: string;
  date: string;
  type: string;
  title: string;
  content: string;
  prescription: string | null;
  createdAt: string;
}

interface Appointment {
  id: string;
  date: string;
  duration: number;
  status: string;
  type: string;
  notes: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  whatsappPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const TAG_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-yellow-100 text-yellow-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
  "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  consultation: "Consulta",
  exam: "Exame",
  prescription: "Receita",
  note: "Anotação",
};

type TabKey = "prontuario" | "consultas" | "conversas";

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("prontuario");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    notes: "",
    tags: "",
  });

  const fetchPatient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Paciente não encontrado.");
        } else {
          throw new Error("Erro ao buscar paciente");
        }
        return;
      }
      const data: Patient = await response.json();
      setPatient(data);
      setEditForm({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        cpf: data.cpf || "",
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: data.gender || "",
        address: data.address || "",
        notes: data.notes || "",
        tags: data.tags || "",
      });
    } catch (err) {
      console.error("Erro ao buscar paciente:", err);
      setError("Erro ao carregar dados do paciente.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  // Open in edit mode if URL has ?edit=true
  useEffect(() => {
    if (searchParams.get("edit") === "true" && patient) {
      setIsEditing(true);
    }
  }, [searchParams, patient]);

  const handleSave = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email || null,
          cpf: editForm.cpf || null,
          dateOfBirth: editForm.dateOfBirth || null,
          gender: editForm.gender || null,
          address: editForm.address || null,
          notes: editForm.notes || null,
          tags: editForm.tags || null,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar");

      setIsEditing(false);
      fetchPatient();
    } catch (err) {
      console.error("Erro ao salvar paciente:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (patient) {
      setEditForm({
        name: patient.name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        cpf: patient.cpf || "",
        dateOfBirth: patient.dateOfBirth
          ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: patient.gender || "",
        address: patient.address || "",
        notes: patient.notes || "",
        tags: patient.tags || "",
      });
    }
    setIsEditing(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Link
          href="/patients"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Pacientes
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-red-50 p-4">
              <User className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {error || "Paciente não encontrado"}
            </h3>
            <Link href="/patients" className="mt-4">
              <Button variant="outline">Voltar para Pacientes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tags = patient.tags
    ? patient.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "prontuario", label: "Prontuário", count: patient._count.medicalRecords },
    { key: "consultas", label: "Consultas", count: patient._count.appointments },
    { key: "conversas", label: "Conversas", count: patient._count.conversations },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/patients"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Pacientes
      </Link>

      {/* Patient info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl">{patient.name}</CardTitle>
                <p className="mt-0.5 text-sm text-gray-500">
                  Cadastrado em {formatDate(patient.createdAt)}
                </p>
              </div>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            /* Inline edit form */
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nome *"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                error={
                  !editForm.name.trim() ? "Nome é obrigatório" : undefined
                }
              />
              <Input
                label="Telefone *"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                error={
                  !editForm.phone.trim()
                    ? "Telefone é obrigatório"
                    : undefined
                }
              />
              <Input
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <Input
                label="CPF"
                value={editForm.cpf}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, cpf: e.target.value }))
                }
              />
              <Input
                label="Data de Nascimento"
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    dateOfBirth: e.target.value,
                  }))
                }
              />
              <Select
                label="Gênero"
                value={editForm.gender}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, gender: e.target.value }))
                }
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Outro">Outro</option>
              </Select>
              <div className="sm:col-span-2">
                <Input
                  label="Endereço"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Tags (separadas por vírgula)"
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="ex: idoso, diabético, hipertenso"
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Observações"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
          ) : (
            /* Read-only info display */
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPhone(patient.phone)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.email || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">CPF</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.cpf || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Data de Nascimento</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.dateOfBirth
                      ? formatDate(patient.dateOfBirth)
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Gênero</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.gender === "M"
                      ? "Masculino"
                      : patient.gender === "F"
                        ? "Feminino"
                        : patient.gender || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Endereço</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.address || "—"}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="mb-1.5 text-xs text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag} className={getTagColor(tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {patient.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="mb-1 text-xs text-gray-500">Observações</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {patient.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div>
        <div className="border-b">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    activeTab === tab.key
                      ? "bg-primary-100 text-primary-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {/* Prontuario tab */}
          {activeTab === "prontuario" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Prontuário Médico
                </h3>
                <Link href={`/records/new?patientId=${patient.id}`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Registro
                  </Button>
                </Link>
              </div>

              {patient.medicalRecords.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <FileText className="h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500">
                      Nenhum registro no prontuário.
                    </p>
                    <Link
                      href={`/records/new?patientId=${patient.id}`}
                      className="mt-3"
                    >
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Registro
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {patient.medicalRecords.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge>
                                {RECORD_TYPE_LABELS[record.type] || record.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(record.date)}
                              </span>
                            </div>
                            <h4 className="mt-2 font-medium text-gray-900">
                              {record.title}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                              {record.content}
                            </p>
                            {record.prescription && (
                              <p className="mt-1 text-sm text-medical-700">
                                Receita: {record.prescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Consultas tab */}
          {activeTab === "consultas" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Consultas e Agendamentos
                </h3>
                <Link href={`/appointments/new?patientId=${patient.id}`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Consulta
                  </Button>
                </Link>
              </div>

              {patient.appointments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <Calendar className="h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500">
                      Nenhuma consulta agendada.
                    </p>
                    <Link
                      href={`/appointments/new?patientId=${patient.id}`}
                      className="mt-3"
                    >
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Agendar Consulta
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {patient.appointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  appointmentStatusColors[appointment.status] ||
                                  ""
                                }
                              >
                                {appointmentStatusLabels[appointment.status] ||
                                  appointment.status}
                              </Badge>
                              <Badge variant="outline">
                                {appointmentTypeLabels[appointment.type] ||
                                  appointment.type}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDateTime(appointment.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {appointment.duration} min
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="mt-2 text-sm text-gray-500">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversas tab */}
          {activeTab === "conversas" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Conversas WhatsApp
                </h3>
                <Link href={`/conversations?patientId=${patient.id}`}>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Ver Todas as Conversas
                  </Button>
                </Link>
              </div>

              {patient.conversations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <MessageSquare className="h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500">
                      Nenhuma conversa encontrada para este paciente.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {patient.conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/conversations/${conversation.id}`}
                    >
                      <Card className="cursor-pointer transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                <MessageSquare className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatPhone(conversation.whatsappPhone)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Atualizada em{" "}
                                  {formatDateTime(conversation.updatedAt)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={
                                conversation.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : conversation.status === "waiting"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : conversation.status === "resolved"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-red-100 text-red-800"
                              }
                            >
                              {conversation.status === "active"
                                ? "Ativa"
                                : conversation.status === "waiting"
                                  ? "Aguardando"
                                  : conversation.status === "resolved"
                                    ? "Resolvida"
                                    : "Escalada"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
