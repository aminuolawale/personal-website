"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Bookmark, ChevronDown } from "lucide-react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <div className="w-7 h-7 rounded-full bg-surface/10 animate-pulse" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google", { callbackUrl: window.location.href })}
        className="font-mono text-xs text-muted/50 hover:text-accent transition-colors border border-surface/15 px-3 py-1.5 hover:border-accent/40"
      >
        Sign in
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
        aria-label="Account menu"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? ""}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center font-mono text-xs text-accent">
            {session.user?.name?.[0] ?? "?"}
          </div>
        )}
        <ChevronDown size={12} className="text-muted/40" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-base border border-surface/15 shadow-xl z-50 py-1">
          <div className="px-3 py-2 border-b border-surface/10">
            <p className="text-surface text-xs font-semibold truncate">{session.user?.name}</p>
            <p className="font-mono text-[10px] text-muted/40 truncate">{session.user?.email}</p>
          </div>
          <Link
            href="/bookmarks"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-muted/60 hover:text-accent hover:bg-surface/5 transition-colors"
          >
            <Bookmark size={12} />
            My Bookmarks
          </Link>
          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
            className="flex items-center gap-2 w-full px-3 py-2 font-mono text-xs text-muted/60 hover:text-accent hover:bg-surface/5 transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
