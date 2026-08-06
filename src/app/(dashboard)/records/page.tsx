"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Plus,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";

/* ---------- Types ---------- */
interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  type: string;
  title: string;
  content: string;
  prescription?: string | null;
  createdAt: string;
  patient: { id: string; name: string };
}

/* ---------- Constants ---------- */
const recordTypeLabels: Record<string, string> = {
  consultation: "Consulta",
  exam: "Exame",
  prescription: "Receita",
  note: "Anotacao",
};

const recordTypeColors: Record<string, string> = {
  consultation: "bg-blue-100 text-blue-800",
  exam: "bg-purple-100 text-purple-800",
  prescription: "bg-green-100 text-green-800",
  note: "bg-yellow-100 text-yellow-800",
};

const recordTypeOptions = [
  { value: "consultation", label: "Consulta" },
  { value: "exam", label: "Exame" },
  { value: "prescription", label: "Receita" },
  { value: "note", label: "Anotacao" },
];

/* ========================================== */
/*  Medical Records Page                      */
/* ========================================== */
export default function RecordsPage() {
  /* --- Patient search --- */
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  /* --- Selected patient --- */
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  /* --- Records --- */
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  /* --- New record form --- */
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("consultation");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPrescription, setFormPrescription] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  /* ---- Search patients ---- */
  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }
    try {
      setPatientsLoading(true);
      const res = await fetch(
        `/api/patients?search=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Falha ao buscar pacientes");
      const data = await res.json();
      setPatients(data.patients ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  /* Debounced search */
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  /* ---- Fetch records for selected patient ---- */
  const fetchRecords = useCallback(async (patientId: string) => {
    try {
      setRecordsLoading(true);
      const res = await fetch(
        `/api/medical-records?patientId=${patientId}`
      );
      if (!res.ok) throw new Error("Falha ao buscar prontuarios");
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchRecords(selectedPatient.id);
    }
  }, [selectedPatient, fetchRecords]);

  /* ---- Select a patient ---- */
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch("");
    setPatients([]);
    setShowForm(false);
  };

  /* ---- Submit new record ---- */
  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!formTitle.trim() || !formContent.trim()) {
      setFormError("Titulo e conteudo sao obrigatorios.");
      return;
    }

    setFormError("");
    setFormSubmitting(true);

    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          type: formType,
          title: formTitle.trim(),
          content: formContent.trim(),
          prescription: formPrescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao criar prontuario");
      }

      // Reset form and refresh
      setFormTitle("");
      setFormContent("");
      setFormPrescription("");
      setFormType("consultation");
      setShowForm(false);
      await fetchRecords(selectedPatient.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setFormSubmitting(false);
    }
  };

  /* ============================= */
  /*  Render                        */
  /* ============================= */
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FileText className="h-7 w-7 text-medical-500" />
          Prontuarios
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Busque um paciente para visualizar e gerenciar seus prontuarios medicos.
        </p>
      </div>

      {/* Patient search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Buscar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Digite o nome ou telefone do paciente..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-medical-400 focus:ring-1 focus:ring-medical-400"
            />
          </div>

          {/* Search results */}
          {patientsLoading && (
            <p className="mt-3 text-sm text-gray-400">Buscando pacientes...</p>
          )}

          {!patientsLoading && patients.length > 0 && (
            <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {patients.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => handleSelectPatient(p)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-medical-100 text-medical-700">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.phone}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!patientsLoading &&
            patientSearch.trim() &&
            patients.length === 0 && (
              <p className="mt-3 text-sm text-gray-400">
                Nenhum paciente encontrado.
              </p>
            )}
        </CardContent>
      </Card>

      {/* Selected patient + records */}
      {selectedPatient && (
        <>
          {/* Patient info bar */}
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-medical-100 text-medical-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedPatient.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedPatient.phone}
                    {selectedPatient.email && ` - ${selectedPatient.email}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowForm(true);
                    setFormError("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-medical-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-medical-600"
                >
                  <Plus className="h-4 w-4" />
                  Novo Registro
                </button>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setRecords([]);
                    setShowForm(false);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Trocar Paciente
                </button>
              </div>
            </CardContent>
          </Card>

          {/* New record form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4" />
                  Novo Registro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRecord} className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Tipo
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-medical-400 focus:ring-1 focus:ring-medical-400"
                    >
                      {recordTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Titulo
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ex: Consulta de rotina"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-medical-400 focus:ring-1 focus:ring-medical-400"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Conteudo
                    </label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      rows={5}
                      placeholder="Descreva sintomas, diagnostico, observacoes..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-medical-400 focus:ring-1 focus:ring-medical-400"
                    />
                  </div>

                  {/* Prescription (optional) */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Prescricao{" "}
                      <span className="font-normal text-gray-400">(opcional)</span>
                    </label>
                    <textarea
                      value={formPrescription}
                      onChange={(e) => setFormPrescription(e.target.value)}
                      rows={3}
                      placeholder="Medicamentos, dosagem, instrucoes..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-medical-400 focus:ring-1 focus:ring-medical-400"
                    />
                  </div>

                  {/* Error */}
                  {formError && (
                    <p className="text-sm text-red-600">{formError}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-medical-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-medical-600 disabled:opacity-50"
                    >
                      {formSubmitting ? "Salvando..." : "Salvar Registro"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setFormError("");
                      }}
                      className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Records list */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Historico de Prontuarios
            </h2>

            {recordsLoading ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Carregando prontuarios...
              </p>
            ) : records.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <FileText className="mb-2 h-8 w-8" />
                  <p className="text-sm">
                    Nenhum prontuario encontrado para este paciente.
                  </p>
                </CardContent>
              </Card>
            ) : (
              records.map((rec) => (
                <Card key={rec.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              recordTypeColors[rec.type] ??
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {recordTypeLabels[rec.type] ?? rec.type}
                          </Badge>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {rec.title}
                          </h3>
                        </div>

                        <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                          {rec.content}
                        </p>

                        {rec.prescription && (
                          <div className="mt-2 rounded-md bg-green-50 p-2">
                            <p className="text-xs font-medium text-green-800">
                              Prescricao:
                            </p>
                            <p className="line-clamp-2 text-xs text-green-700">
                              {rec.prescription}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col items-end gap-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(rec.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(rec.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
