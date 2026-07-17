export const NETWORK_KEYS = [
  "twitter_x",
  "youtube",
  "facebook",
  "gettr",
] as const;

export type NetworkKey = (typeof NETWORK_KEYS)[number];

export const NETWORK_LABELS: Record<NetworkKey, string> = {
  twitter_x: "Twitter",
  youtube: "YouTube",
  facebook: "Canal do Facebook",
  gettr: "Gettr",
};

/** Cor da marca de cada destino — usada no logo do card. */
export const NETWORK_BRAND: Record<NetworkKey, string> = {
  twitter_x: "#000000",
  youtube: "#FF0000",
  facebook: "#1877F2",
  gettr: "#E5322D",
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const TIMEZONE = "America/Sao_Paulo";
