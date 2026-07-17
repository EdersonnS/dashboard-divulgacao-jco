"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-linha bg-painel p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-semibold text-tinta">
          Dashboard Divulgação
        </h1>
        <p className="mb-6 text-sm text-tinta-fraca">
          Entre com o usuário e senha da equipe.
        </p>

        <label className="mb-1 block text-sm font-medium text-tinta">
          Usuário
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
          className="mb-4 w-full rounded-lg border border-linha-forte px-3 py-2.5 text-sm focus:border-marca focus:outline-none focus-visible:ring-2 focus-visible:ring-marca"
        />

        <label className="mb-1 block text-sm font-medium text-tinta">
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-linha-forte px-3 py-2.5 text-sm focus:border-marca focus:outline-none focus-visible:ring-2 focus-visible:ring-marca"
        />

        {error && (
          <p className="mb-4 rounded-lg bg-erro-suave px-3 py-2 text-sm text-erro-ink">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
