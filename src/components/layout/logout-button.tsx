"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
export function LogoutButton() { const router = useRouter(); async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); } return <button type="button" onClick={logout} aria-label="ログアウト" className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink"><LogOut className="size-4" /></button>; }
