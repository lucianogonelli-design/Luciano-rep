"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  Clock,
  User,
} from "lucide-react";
import {
  formatDateTime,
  formatTime,
  formatPhone,
  conversationStatusLabels,
  conversationStatusColors,
} from "@/lib/utils";
import Link from "next/link";

/* ---------- Types ---------- */
interface Patient {
  id: string;
  name: string;
  phone: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  mediaType?: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  whatsappPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  patient: Patient | null;
  messages: Message[];
  _count: { messages: number };
}

interface ConversationDetail {
  id: string;
  whatsappPhone: string;
  status: string;
  patient: Patient | null;
  messages: Message[];
}

/* ---------- Constants ---------- */
const statusFilters = [
  { value: "", label: "Todas" },
  { value: "active", label: "Ativa" },
  { value: "waiting", label: "Aguardando" },
  { value: "resolved", label: "Resolvida" },
  { value: "escalated", label: "Escalada" },
];

const validStatuses = ["active", "waiting", "resolved", "escalated"];

/* ========================================== */
/*  Conversations Page                        */
/* ========================================== */
export default function ConversationsPage() {
  /* --- List state --- */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* --- Detail state --- */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* --- Message input --- */
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ---- Fetch conversation list ---- */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/conversations?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao buscar conversas");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ---- Fetch conversation detail ---- */
  const fetchDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("Falha ao buscar conversa");
      const data: ConversationDetail = await res.json();
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  /* ---- Auto-scroll to bottom ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  /* ---- Send message ---- */
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedId || sending) return;
    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // 1. Persist user message
      await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, role: "user" }),
      });

      // 2. Get AI response
      try {
        const aiRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: selectedId, message: content }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          // Persist assistant message
          if (aiData.reply) {
            await fetch(`/api/conversations/${selectedId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: aiData.reply, role: "assistant" }),
            });
          }
        }
      } catch {
        // AI chat endpoint may not exist yet -- silently ignore
      }

      // 3. Refresh detail
      await fetchDetail(selectedId);
      await fetchConversations();
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setSending(false);
    }
  };

  /* ---- Change conversation status ---- */
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      await fetchDetail(selectedId);
      await fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  /* ---- Filter conversations by search ---- */
  const filtered = conversations.filter((c) => {
    const name = c.patient?.name?.toLowerCase() ?? "";
    const phone = c.whatsappPhone?.toLowerCase() ?? "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  /* ============================= */
  /*  Render                        */
  /* ============================= */
  return (
    <div className="-m-6 flex h-[calc(100vh)] overflow-hidden">
      {/* ========== LEFT PANEL: Conversation List ========== */}
      <div className="flex w-[380px] min-w-[320px] flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 bg-[#f0f2f5] px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h1 className="text-lg font-semibold text-gray-800">Conversas</h1>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-gray-100 bg-white px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar ou iniciar nova conversa"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-[#f0f2f5] py-1.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-500 outline-none focus:ring-1 focus:ring-medical-400"
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-1 overflow-x-auto border-b border-gray-100 bg-white px-3 py-2">
          {statusFilters.map((sf) => (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === sf.value
                  ? "bg-medical-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* Conversation items */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Carregando conversas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-gray-400">
              <MessageSquare className="mb-2 h-8 w-8" />
              Nenhuma conversa encontrada
            </div>
          ) : (
            filtered.map((conv) => {
              const lastMsg = conv.messages?.[0];
              const isSelected = conv.id === selectedId;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors ${
                    isSelected ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-white">
                    <User className="h-6 w-6" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {conv.patient?.name ?? formatPhone(conv.whatsappPhone)}
                      </span>
                      <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                        {formatTime(conv.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between">
                      <p className="truncate text-xs text-gray-500">
                        {lastMsg?.content ?? "Sem mensagens"}
                      </p>
                      <Badge
                        className={`ml-2 flex-shrink-0 text-[10px] ${
                          conversationStatusColors[conv.status] ?? ""
                        }`}
                      >
                        {conversationStatusLabels[conv.status] ?? conv.status}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ========== RIGHT PANEL: Chat View ========== */}
      <div className="flex flex-1 flex-col bg-[#efeae2]">
        {!selectedId ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] text-gray-500">
            <MessageSquare className="mb-4 h-16 w-16 text-gray-300" />
            <h2 className="text-xl font-light text-gray-600">Doctor CRM Chat</h2>
            <p className="mt-2 text-sm text-gray-400">
              Selecione uma conversa para visualizar as mensagens
            </p>
          </div>
        ) : detailLoading && !detail ? (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            Carregando conversa...
          </div>
        ) : detail ? (
          <>
            {/* ---- Chat header ---- */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#f0f2f5] px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-white">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {detail.patient?.name ?? formatPhone(detail.whatsappPhone)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="h-3 w-3" />
                    {formatPhone(detail.whatsappPhone)}
                    {detail.patient && (
                      <Link
                        href={`/patients/${detail.patient.id}`}
                        className="ml-2 text-medical-600 hover:underline"
                      >
                        Ver paciente
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Status selector */}
              <div className="flex items-center gap-2">
                <select
                  value={detail.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none focus:ring-1 focus:ring-medical-400"
                >
                  {validStatuses.map((s) => (
                    <option key={s} value={s}>
                      {conversationStatusLabels[s]}
                    </option>
                  ))}
                </select>

                <Badge
                  className={conversationStatusColors[detail.status] ?? ""}
                >
                  {conversationStatusLabels[detail.status] ?? detail.status}
                </Badge>
              </div>
            </div>

            {/* ---- Messages ---- */}
            <div
              className="flex-1 overflow-y-auto px-12 py-4"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {detail.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Nenhuma mensagem nesta conversa
                </div>
              ) : (
                detail.messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="my-2 flex justify-center"
                      >
                        <span className="rounded-lg bg-[#e2f7cb] px-3 py-1 text-xs text-gray-600 shadow-sm">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`mb-2 flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`relative max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
                          isUser
                            ? "bg-[#d9fdd3] text-gray-900"
                            : "bg-white text-gray-900"
                        }`}
                      >
                        {/* Tail */}
                        <div
                          className={`absolute top-0 h-3 w-3 ${
                            isUser
                              ? "-right-1.5 bg-[#d9fdd3]"
                              : "-left-1.5 bg-white"
                          }`}
                          style={{
                            clipPath: isUser
                              ? "polygon(0 0, 100% 0, 0 100%)"
                              : "polygon(100% 0, 0 0, 100% 100%)",
                          }}
                        />
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-[10px] text-gray-500">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ---- Message input ---- */}
            <div className="border-t border-gray-200 bg-[#f0f2f5] px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Digite uma mensagem"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-1 focus:ring-medical-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-medical-500 text-white transition-colors hover:bg-medical-600 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
