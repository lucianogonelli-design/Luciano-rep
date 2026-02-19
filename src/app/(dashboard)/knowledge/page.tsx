"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Tag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KnowledgeDoc {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: "faq", label: "Perguntas Frequentes (FAQ)" },
  { value: "service", label: "Serviços" },
  { value: "pricing", label: "Preços e Convênios" },
  { value: "procedure", label: "Procedimentos" },
  { value: "general", label: "Informações Gerais" },
];

const categoryLabels: Record<string, string> = {
  faq: "FAQ",
  service: "Serviço",
  pricing: "Preços",
  procedure: "Procedimento",
  general: "Geral",
};

const categoryColors: Record<string, string> = {
  faq: "bg-blue-100 text-blue-800",
  service: "bg-green-100 text-green-800",
  pricing: "bg-yellow-100 text-yellow-800",
  procedure: "bg-purple-100 text-purple-800",
  general: "bg-gray-100 text-gray-800",
};

const emptyForm = {
  category: "faq",
  title: "",
  content: "",
  tags: "",
};

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterCategory !== "all") params.set("category", filterCategory);

      const res = await fetch(`/api/knowledge-base?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch {
      // erro silencioso
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  function handleNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(doc: KnowledgeDoc) {
    setForm({
      category: doc.category,
      title: doc.title,
      content: doc.content,
      tags: doc.tags || "",
    });
    setEditingId(doc.id);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);

    try {
      const url = editingId
        ? `/api/knowledge-base/${editingId}`
        : "/api/knowledge-base";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        handleCancel();
        fetchDocuments();
      }
    } catch {
      // erro silencioso
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      const res = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(documents.filter((d) => d.id !== id));
      }
    } catch {
      // erro silencioso
    }
  }

  async function handleToggleActive(doc: KnowledgeDoc) {
    try {
      const res = await fetch(`/api/knowledge-base/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !doc.isActive }),
      });
      if (res.ok) {
        setDocuments(
          documents.map((d) =>
            d.id === doc.id ? { ...d, isActive: !d.isActive } : d
          )
        );
      }
    } catch {
      // erro silencioso
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Base de Conhecimento
            </h1>
            <p className="text-gray-500">
              Informações que a IA usa para responder pacientes no WhatsApp
            </p>
          </div>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Explicação simples */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-600">
            <strong>Como funciona:</strong> Cadastre aqui informações sobre sua
            clínica (preços, serviços, horários, perguntas frequentes, etc.).
            Quando um paciente perguntar algo no WhatsApp, a IA vai consultar
            esses documentos para dar respostas mais precisas e personalizadas.
          </p>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Editar Documento" : "Novo Documento"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Categoria"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Horário de funcionamento"
              />
            </div>

            <Textarea
              label="Conteúdo"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={`Escreva aqui as informações que a IA deve saber.\n\nExemplo:\nA clínica funciona de segunda a sexta, das 8h às 18h.\nAos sábados, das 8h às 12h.\nNão abrimos aos domingos e feriados.`}
              rows={6}
            />

            <Input
              label="Tags (opcional, separadas por vírgula)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="horário, funcionamento, atendimento"
            />

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="secondary" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.content.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de documentos */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">
              Nenhum documento na base de conhecimento
            </p>
            <p className="text-sm text-gray-400">
              Clique em &quot;Novo Documento&quot; para começar a alimentar a IA com
              informações da sua clínica.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={!doc.isActive ? "opacity-50" : ""}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={
                          categoryColors[doc.category] || categoryColors.general
                        }
                      >
                        {categoryLabels[doc.category] || doc.category}
                      </Badge>
                      {!doc.isActive && (
                        <Badge className="bg-red-100 text-red-800">
                          Desativado
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {doc.content}
                    </p>
                    {doc.tags && (
                      <div className="flex items-center gap-1 mt-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {doc.tags}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(doc)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={doc.isActive ? "Desativar" : "Ativar"}
                    >
                      {doc.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(doc)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
