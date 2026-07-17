"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { NETWORK_LABELS, NETWORK_BRAND, type NetworkKey } from "@/lib/constants";
import { copyToClipboard } from "@/lib/copy";
import { NetworkLogo } from "./NetworkLogo";

export interface MateriaNetwork {
  networkKey: string;
  renderedText: string;
  copied: boolean;
  confirmed: boolean;
}

/** Ponto + rótulo do estado do destino. */
function DestinoStatus({ copied, confirmed }: { copied: boolean; confirmed: boolean }) {
  const state = confirmed
    ? { label: "Divulgado", dot: "bg-ok", ink: "text-ok-ink" }
    : copied
      ? { label: "Copiado", dot: "bg-info", ink: "text-info-ink" }
      : { label: "Pendente", dot: "bg-espera", ink: "text-espera-ink" };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${state.ink}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} aria-hidden />
      {state.label}
    </span>
  );
}

export function NetworkCopyCard({
  materiaId,
  network,
  onChanged,
}: {
  materiaId: number;
  network: MateriaNetwork;
  onChanged: () => void;
}) {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showText, setShowText] = useState(false);

  async function sendAction(action: "copy" | "confirm" | "unconfirm") {
    setBusy(true);
    try {
      await fetch(`/api/materias/${materiaId}/networks/${network.networkKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    const ok = await copyToClipboard(network.renderedText);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
    await sendAction("copy");
  }

  const key = network.networkKey as NetworkKey;
  const label = NETWORK_LABELS[key] ?? network.networkKey;

  // o card muda de cor conforme o progresso: branco → azul (copiado) → verde (divulgado)
  const cardClass = network.confirmed
    ? "card-divulgado"
    : network.copied
      ? "card-copiado"
      : "card";

  return (
    <div className={`${cardClass} flex flex-col p-3.5 transition-colors`}>
      <div className="flex items-center gap-2.5">
        <span
          className="border-linha flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
          style={{ color: NETWORK_BRAND[key] ?? "#16181d" }}
        >
          <NetworkLogo networkKey={key} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{label}</span>
          <DestinoStatus copied={network.copied} confirmed={network.confirmed} />
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowText((v) => !v)}
          aria-expanded={showText}
          className="border-linha-forte text-tinta hover:bg-canvas flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px] font-medium transition-colors"
        >
          Ver texto
          {showText ? (
            <ChevronUp size={13} strokeWidth={2.25} aria-hidden />
          ) : (
            <ChevronDown size={13} strokeWidth={2.25} aria-hidden />
          )}
        </button>
        <button
          onClick={handleCopy}
          disabled={busy}
          aria-label={`Copiar texto para ${label}`}
          className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
            copyFeedback
              ? "border-ok bg-ok-suave text-ok-ink"
              : "border-linha-forte text-tinta-media hover:bg-canvas hover:text-tinta"
          }`}
        >
          {copyFeedback ? (
            <Check size={15} strokeWidth={2.5} aria-hidden />
          ) : (
            <Copy size={15} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>

      {showText && (
        <>
          <p className="bg-canvas text-tinta mt-3 max-h-40 overflow-y-auto rounded-lg p-2.5 text-[13px] leading-relaxed whitespace-pre-wrap">
            {network.renderedText}
          </p>
          <label className="text-tinta-media mt-1 flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={network.confirmed}
              disabled={busy}
              onChange={(e) => sendAction(e.target.checked ? "confirm" : "unconfirm")}
              className="accent-marca h-4 w-4"
            />
            Marcar como divulgado
          </label>
        </>
      )}
    </div>
  );
}
