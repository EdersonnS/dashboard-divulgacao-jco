/**
 * Copia texto para a área de transferência de forma robusta.
 *
 * Usa a Clipboard API moderna quando disponível (requer contexto seguro:
 * https ou localhost). Cai para um fallback com <textarea> + execCommand
 * quando a equipe acessa via IP da LAN em http, onde navigator.clipboard
 * fica indisponível — cenário comum em celular apontando para a VPS/rede local.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // cai no fallback abaixo
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
