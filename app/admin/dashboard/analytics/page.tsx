"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Bookmark, MessageSquare, Globe, Clock } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import type { ReaderProfile } from "@/app/api/admin/analytics/route";

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function Avatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name ?? ""}
        width={36}
        height={36}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[#fc9e4f]/20 flex items-center justify-center font-mono text-xs text-[#fc9e4f] shrink-0">
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function CountryFlag({ country }: { country: string | null }) {
  if (!country) return <span className="text-[#edd382]/25">—</span>;
  // Convert ISO 3166-1 alpha-2 code to flag emoji using regional indicator symbols
  const flag = country
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
  return (
    <span title={country} className="text-base leading-none">
      {flag} <span className="font-mono text-[10px] text-[#edd382]/40">{country}</span>
    </span>
  );
}

export default function AnalyticsPage() {
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((data) => {
        setReaders(data.readers ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#020122] text-[#edd382]">
      <AdminPageHeader title="Analytics" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Readers", value: total },
            { label: "Bookmarks", value: readers.reduce((s, r) => s + r.bookmarkCount, 0) },
            { label: "Comments", value: readers.reduce((s, r) => s + r.commentCount, 0) },
          ].map(({ label, value }) => (
            <div key={label} className="border border-[#f2f3ae]/10 p-4 text-center">
              <p className="font-mono text-2xl font-bold text-[#fc9e4f]">{loading ? "…" : value}</p>
              <p className="font-mono text-[10px] text-[#edd382]/35 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="font-mono text-xs text-[#edd382]/30 text-center py-16">Loading…</p>
        ) : readers.length === 0 ? (
          <div className="text-center py-24 border border-[#f2f3ae]/10">
            <p className="font-mono text-sm text-[#edd382]/30">No readers yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f2f3ae]/[0.06]">
            {readers.map((reader) => (
              <div key={reader.email}>
                {/* Reader row */}
                <button
                  onClick={() => setExpanded(expanded === reader.email ? null : reader.email)}
                  className="w-full py-4 flex items-center gap-4 hover:bg-[#f2f3ae]/[0.015] -mx-3 px-3 transition-colors text-left"
                >
                  <Avatar name={reader.name} avatarUrl={reader.avatarUrl} />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="text-[#f2f3ae] text-sm font-semibold truncate">
                        {reader.name ?? reader.email}
                      </span>
                      {reader.name && (
                        <span className="font-mono text-[10px] text-[#edd382]/35 truncate">{reader.email}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 font-mono text-[10px] text-[#edd382]/40">
                        <Clock size={10} />
                        {timeAgo(reader.firstSeen)}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-[#edd382]/40">
                        <Globe size={10} />
                        <CountryFlag country={reader.country} />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#edd382]/50">
                      <Bookmark size={11} />
                      {reader.bookmarkCount}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#edd382]/50">
                      <MessageSquare size={11} />
                      {reader.commentCount}
                    </span>
                    <span className="font-mono text-[10px] text-[#edd382]/25">
                      {expanded === reader.email ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === reader.email && (
                  <div className="pb-6 pl-13 ml-[52px] border-l border-[#f2f3ae]/[0.06] pl-4 space-y-6">
                    {reader.bookmarks.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] text-[#edd382]/30 uppercase tracking-widest mb-3">
                          Bookmarks ({reader.bookmarkCount})
                        </p>
                        <div className="space-y-2">
                          {reader.bookmarks.map((b) => (
                            <div key={b.id} className="flex items-center justify-between gap-4">
                              <span className="text-[#f2f3ae]/75 text-xs truncate">
                                {b.article?.title ?? `Article #${b.articleId}`}
                              </span>
                              <span className="font-mono text-[10px] text-[#edd382]/30 shrink-0">
                                {timeAgo(b.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {reader.comments.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] text-[#edd382]/30 uppercase tracking-widest mb-3">
                          Comments ({reader.commentCount})
                        </p>
                        <div className="space-y-3">
                          {reader.comments.map((c) => (
                            <div key={c.id} className="space-y-0.5">
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-mono text-[10px] text-[#edd382]/40 truncate">
                                  {c.article?.title ?? `Article #${c.articleId}`}
                                  {!c.approved && (
                                    <span className="ml-2 text-[#fc9e4f]/60">(pending)</span>
                                  )}
                                </span>
                                <span className="font-mono text-[10px] text-[#edd382]/30 shrink-0">
                                  {timeAgo(c.createdAt)}
                                </span>
                              </div>
                              <p className="text-[#f2f3ae]/60 text-xs leading-relaxed line-clamp-2">
                                {c.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
