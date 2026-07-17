"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";

interface MateriaForNotification {
  id: number;
  titulo: string;
  scheduledAt: string;
  cancelledAt: string | null;
}

const STORAGE_KEY = "dd-notified-materias";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getNotifiedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

function markNotified(id: number) {
  const ids = getNotifiedIds();
  ids.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function NotificationWatcher() {
  const { data } = useSWR<MateriaForNotification[]>("/api/materias", fetcher, {
    refreshInterval: 10000,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/notification-sound.wav");
  }, []);

  useEffect(() => {
    if (!data) return;
    if (typeof Notification === "undefined") return;

    const now = new Date();
    const notifiedIds = getNotifiedIds();

    const due = data.filter(
      (m) =>
        !m.cancelledAt &&
        !notifiedIds.has(m.id) &&
        new Date(m.scheduledAt) <= now,
    );

    if (due.length === 0) return;

    async function notify() {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") return;

      for (const m of due) {
        new Notification("Matéria pronta para divulgar", { body: m.titulo });
        markNotified(m.id);
      }
      audioRef.current?.play().catch(() => {});
    }

    notify();
  }, [data]);

  return null;
}
