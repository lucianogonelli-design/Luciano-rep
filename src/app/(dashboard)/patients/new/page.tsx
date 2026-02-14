"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
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

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.phone.trim()) {
      setError("Nome e telefone são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dateOfBirth: form.dateOfBirth
            ? new Date(form.dateOfBirth).toISOString()
            : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar paciente");
      }

      const patient = await res.json();
      router.push(`/patients/${patient.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar paciente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/patients"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para Pacientes
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome *"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nome completo"
                required
              />
              <Input
                label="Telefone (WhatsApp) *"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="5511999990000"
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@exemplo.com"
              />
              <Input
                label="CPF"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                placeholder="00000000000"
              />
              <Input
                label="Data de Nascimento"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
              <Select
                label="Gênero"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Outro">Outro</option>
              </Select>
            </div>

            <Input
              label="Endereço"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Rua, número, bairro, cidade - UF"
            />

            <Input
              label="Tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="diabetes, hipertensão (separadas por vírgula)"
            />

            <Textarea
              label="Observações"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Anotações sobre o paciente..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/patients">
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Cadastrar Paciente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
