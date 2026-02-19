"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Bot,
  BookOpen,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Pacientes", href: "/patients", icon: Users },
  { label: "Agendamentos", href: "/appointments", icon: Calendar },
  { label: "Conversas", href: "/conversations", icon: MessageSquare },
  { label: "Prontuários", href: "/records", icon: FileText },
  { label: "Base de Conhecimento", href: "/knowledge", icon: BookOpen },
  { label: "Configurações IA", href: "/settings/ai", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-gray-700 px-6 py-5">
        <Stethoscope className="h-8 w-8 text-medical-400" />
        <span className="text-xl font-bold tracking-tight">Doctor CRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 px-6 py-4">
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Doctor CRM
        </p>
      </div>
    </aside>
  );
}
