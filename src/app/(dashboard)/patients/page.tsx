"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, User, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatPhone } from "@/lib/utils";

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
  _count: {
    appointments: number;
    conversations: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPatients = useCallback(async (searchQuery: string, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(page));
      params.set("limit", "20");

      const response = await fetch(`/api/patients?${params.toString()}`);
      if (!response.ok) throw new Error("Erro ao buscar pacientes");

      const data = await response.json();
      setPatients(data.patients);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch patients when debounced search changes
  useEffect(() => {
    fetchPatients(debouncedSearch);
  }, [debouncedSearch, fetchPatients]);

  const handleDelete = async () => {
    if (!patientToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/patients/${patientToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir paciente");
      setDeleteModalOpen(false);
      setPatientToDelete(null);
      fetchPatients(debouncedSearch);
    } catch (error) {
      console.error("Erro ao excluir paciente:", error);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    fetchPatients(debouncedSearch, page);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os pacientes do consultório
          </p>
        </div>
        <Link href="/patients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Pacientes
            {pagination && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({pagination.total} {pagination.total === 1 ? "paciente" : "pacientes"})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            /* Loading state */
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-gray-200" />
                    <div className="h-3 w-1/4 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Nenhum paciente encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Nenhum resultado para a busca realizada."
                  : "Comece adicionando o primeiro paciente ao consultório."}
              </p>
              {!search && (
                <Link href="/patients/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Paciente
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            /* Patients table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-gray-500">
                    <th className="pb-3 pr-4">Nome</th>
                    <th className="pb-3 pr-4">Telefone</th>
                    <th className="hidden pb-3 pr-4 md:table-cell">Email</th>
                    <th className="hidden pb-3 pr-4 lg:table-cell">Tags</th>
                    <th className="hidden pb-3 pr-4 sm:table-cell">
                      Data de Cadastro
                    </th>
                    <th className="pb-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patients.map((patient) => {
                    const tags = patient.tags
                      ? patient.tags.split(",").map((t) => t.trim()).filter(Boolean)
                      : [];

                    return (
                      <tr
                        key={patient.id}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/patients/${patient.id}`}
                                className="font-medium text-gray-900 hover:text-primary-600"
                              >
                                {patient.name}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-600">
                          {formatPhone(patient.phone)}
                        </td>
                        <td className="hidden py-3 pr-4 text-sm text-gray-600 md:table-cell">
                          {patient.email || "—"}
                        </td>
                        <td className="hidden py-3 pr-4 lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {tags.length > 0 ? (
                              tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  className={getTagColor(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden py-3 pr-4 text-sm text-gray-600 sm:table-cell">
                          {formatDate(patient.createdAt)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/patients/${patient.id}`}>
                              <Button variant="ghost" size="sm" title="Ver">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/patients/${patient.id}?edit=true`}>
                              <Button variant="ghost" size="sm" title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Excluir"
                              onClick={() => openDeleteModal(patient)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPatientToDelete(null);
        }}
        title="Excluir Paciente"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir o paciente{" "}
            <span className="font-semibold text-gray-900">
              {patientToDelete?.name}
            </span>
            ? Esta ação não pode ser desfeita. Todos os prontuários, consultas e
            conversas associados serão removidos.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setPatientToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
