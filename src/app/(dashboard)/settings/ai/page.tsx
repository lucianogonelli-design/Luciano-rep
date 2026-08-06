"use client";

import { useState, useEffect } from "react";
import { Save, Bot, Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface AISettings {
  id: string;
  provider: string;
  model: string;
  systemPrompt: string;
  greeting: string;
  schedulingEnabled: boolean;
  autoReply: boolean;
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: string;
  maxTokens: number;
  temperature: number;
}

const defaultSettings: AISettings = {
  id: "",
  provider: "openai",
  model: "gpt-4o-mini",
  systemPrompt: "",
  greeting:
    "Olá! Sou o assistente virtual do consultório. Como posso ajudá-lo?",
  schedulingEnabled: true,
  autoReply: true,
  businessHoursOnly: false,
  businessHoursStart: "08:00",
  businessHoursEnd: "18:00",
  businessDays: "1,2,3,4,5",
  maxTokens: 500,
  temperature: 0.7,
};

const daysOfWeek = [
  { value: "0", label: "Dom" },
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
  { value: "6", label: "Sáb" },
];

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/ai-settings");
      if (res.ok) {
        const data = await res.json();
        if (data) setSettings(data);
      }
    } catch {
      // Usa configurações padrão
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // erro silencioso
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testMessage.trim()) return;
    setTesting(true);
    setTestResponse("");
    try {
      // Cria ou usa uma conversa de teste
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappPhone: "test-0000000000",
          status: "active",
        }),
      });
      const conversation = await convRes.json();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: testMessage,
          conversationId: conversation.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResponse(data.response || data.message || "Sem resposta");
      } else {
        setTestResponse("Erro: verifique suas chaves de API nas variáveis de ambiente.");
      }
    } catch {
      setTestResponse("Erro ao conectar com o agente de IA.");
    } finally {
      setTesting(false);
    }
  }

  function toggleDay(day: string) {
    const days = settings.businessDays.split(",").filter(Boolean);
    if (days.includes(day)) {
      setSettings({
        ...settings,
        businessDays: days.filter((d) => d !== day).join(","),
      });
    } else {
      setSettings({
        ...settings,
        businessDays: [...days, day].sort().join(","),
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configurações do Agente de IA
          </h1>
          <p className="text-gray-500">
            Configure o comportamento do assistente virtual no WhatsApp
          </p>
        </div>
      </div>

      {/* Provedor e Modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Provedor de IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Provedor"
              value={settings.provider}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  provider: e.target.value,
                  model:
                    e.target.value === "openai"
                      ? "gpt-4o-mini"
                      : "claude-3-5-haiku-20241022",
                })
              }
            >
              <option value="openai">OpenAI (GPT)</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </Select>
            <Input
              label="Modelo"
              value={settings.model}
              onChange={(e) =>
                setSettings({ ...settings, model: e.target.value })
              }
              placeholder={
                settings.provider === "openai"
                  ? "gpt-4o-mini"
                  : "claude-3-5-haiku-20241022"
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Tokens: {settings.maxTokens}
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={settings.maxTokens}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTokens: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>100</span>
                <span>2000</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperatura: {settings.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Preciso (0)</span>
                <span>Criativo (1)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt e Saudação */}
      <Card>
        <CardHeader>
          <CardTitle>Personalização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Prompt do Sistema"
            value={settings.systemPrompt}
            onChange={(e) =>
              setSettings({ ...settings, systemPrompt: e.target.value })
            }
            placeholder="Instruções para o comportamento do agente de IA..."
            rows={6}
          />
          <Textarea
            label="Mensagem de Saudação"
            value={settings.greeting}
            onChange={(e) =>
              setSettings({ ...settings, greeting: e.target.value })
            }
            placeholder="Mensagem enviada quando o paciente inicia uma conversa..."
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Automação */}
      <Card>
        <CardHeader>
          <CardTitle>Automação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoReply}
                onChange={(e) =>
                  setSettings({ ...settings, autoReply: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Resposta Automática
                </span>
                <p className="text-xs text-gray-500">
                  O agente responde automaticamente às mensagens do WhatsApp
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.schedulingEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    schedulingEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Agendamento Automático
                </span>
                <p className="text-xs text-gray-500">
                  Permite que o agente agende consultas diretamente
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.businessHoursOnly}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessHoursOnly: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Apenas Horário Comercial
                </span>
                <p className="text-xs text-gray-500">
                  O agente só responde durante o horário comercial definido
                </p>
              </div>
            </label>
          </div>

          {settings.businessHoursOnly && (
            <div className="pl-7 space-y-4 border-l-2 border-primary-100 ml-2">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Horário de Início"
                  type="time"
                  value={settings.businessHoursStart}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      businessHoursStart: e.target.value,
                    })
                  }
                />
                <Input
                  label="Horário de Fim"
                  type="time"
                  value={settings.businessHoursEnd}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      businessHoursEnd: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias de Atendimento
                </label>
                <div className="flex gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        settings.businessDays.split(",").includes(day.value)
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Configurações"}
          </Button>
        </CardFooter>
      </Card>

      {/* Testar Agente */}
      <Card>
        <CardHeader>
          <CardTitle>Testar Agente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Envie uma mensagem de teste para verificar o comportamento do agente
            com as configurações atuais.
          </p>
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Digite uma mensagem de teste..."
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
            />
            <Button onClick={handleTest} disabled={testing || !testMessage.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {testing ? "Enviando..." : "Enviar"}
            </Button>
          </div>
          {testResponse && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Resposta do Agente:
              </p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {testResponse}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
