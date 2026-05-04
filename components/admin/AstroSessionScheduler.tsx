"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, CalendarPlus, Trash2 } from "lucide-react";
import type { AstroGear, AstroSession } from "@/lib/schema";
import { SKY_TARGETS, type SkyTargetType } from "@/lib/sky-targets";

type SessionWithGear = AstroSession & { gear: AstroGear[] };

const TARGET_LABELS: Record<SkyTargetType, string> = {
  constellation: "Constellations",
  "deep-sky": "Deep-sky Objects",
  "solar-system": "Planets + Moon",
};

function toLocalDateTimeValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function defaultScheduledAt() {
  const nextNight = new Date();
  nextNight.setDate(nextNight.getDate() + 1);
  nextNight.setHours(22, 0, 0, 0);
  return toLocalDateTimeValue(nextNight);
}

export default function AstroSessionScheduler() {
  const dateTimeInputRef = useRef<HTMLInputElement>(null);
  const [sessions, setSessions] = useState<SessionWithGear[]>([]);
  const [gear, setGear] = useState<AstroGear[]>([]);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt);
  const [targetId, setTargetId] = useState(SKY_TARGETS[0]?.id ?? "");
  const [selectedGearIds, setSelectedGearIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const targetGroups = useMemo(
    () => SKY_TARGETS.reduce<Record<SkyTargetType, typeof SKY_TARGETS>>((acc, target) => {
      acc[target.type].push(target);
      return acc;
    }, { constellation: [], "deep-sky": [], "solar-system": [] }),
    []
  );

  async function loadSessions() {
    const res = await fetch("/api/astro-sessions?admin=true");
    setSessions(res.ok ? await res.json() : []);
  }

  useEffect(() => {
    fetch("/api/astro-gear?type=equipment")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setGear(Array.isArray(data) ? data : []))
      .catch(() => setGear([]));
    fetch("/api/astro-sessions?admin=true")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/astro-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        targetId,
        gearIds: selectedGearIds,
        notes,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save session");
      return;
    }

    setTitle("");
    setNotes("");
    setSelectedGearIds([]);
    setScheduledAt(defaultScheduledAt());
    await loadSessions();
  }

  async function deleteSession(id: number) {
    if (!confirm("Delete this session?")) return;
    const res = await fetch(`/api/astro-sessions/${id}`, { method: "DELETE" });
    if (res.ok) setSessions((items) => items.filter((item) => item.id !== id));
  }

  function toggleGear(id: number) {
    setSelectedGearIds((ids) =>
      ids.includes(id) ? ids.filter((gearId) => gearId !== id) : [...ids, id]
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="border border-surface/10 p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full bg-transparent border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
              placeholder="M42 first light"
              required
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Date + Time</span>
            <div className="mt-1 flex">
              <input
                ref={dateTimeInputRef}
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-transparent border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
                required
              />
              <button
                type="button"
                onClick={() => dateTimeInputRef.current?.showPicker?.()}
                className="border border-l-0 border-surface/15 px-3 text-muted/45 hover:text-accent hover:border-accent/50 transition-colors"
                aria-label="Open date and time picker"
              >
                <CalendarClock size={16} />
              </button>
            </div>
          </label>
        </div>

        <label className="block">
          <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Target</span>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="mt-1 w-full bg-base border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
          >
            {(Object.keys(targetGroups) as SkyTargetType[]).map((type) => (
              <optgroup key={type} label={TARGET_LABELS[type]}>
                {targetGroups[type].map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div>
          <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest mb-2">Equipment</p>
          {gear.length === 0 ? (
            <p className="text-sm text-muted/35">No equipment has been added yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {gear.map((item) => (
                <label key={item.id} className="flex items-center gap-2 border border-surface/10 px-3 py-2 text-sm text-muted/70">
                  <input
                    type="checkbox"
                    checked={selectedGearIds.includes(item.id)}
                    onChange={() => toggleGear(item.id)}
                    className="accent-accent"
                  />
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 min-h-20 w-full bg-transparent border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 border border-accent/40 px-4 py-2 font-mono text-xs text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
        >
          <CalendarPlus size={14} />
          {saving ? "Saving..." : "Schedule Session"}
        </button>
      </form>

      <div className="border border-surface/10 divide-y divide-surface/[0.06]">
        {sessions.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-xs text-muted/30">No sessions scheduled.</p>
        ) : sessions.map((session) => (
          <div key={session.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm text-surface font-medium">{session.title}</p>
              <p className="mt-1 font-mono text-[10px] text-muted/45">
                {new Date(session.scheduledAt).toLocaleString()} · {session.targetName}
              </p>
              {session.gear.length > 0 && (
                <p className="mt-1 text-xs text-muted/45">
                  {session.gear.map((item) => item.name).join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={() => deleteSession(session.id)}
              aria-label={`Delete ${session.title}`}
              className="p-1.5 text-muted/35 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
