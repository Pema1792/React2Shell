"use client";

import { useCallback, useEffect, useState } from "react";
import CommandOutput from "@/components/CommandOutput";

type LabResult = {
  command: string;
  output: string;
  timestamp: string;
  success: boolean;
};

export default function Home() {
  const [result, setResult] = useState<LabResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = useCallback(async () => {
    try {
      const response = await fetch("/api/lab-result", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to retrieve lab result.");
      }

      const data = await response.json();
      setResult(data.result ?? null);
    } catch (error) {
      console.error("Failed to fetch lab result:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  useEffect(() => {
    const interval = setInterval(fetchResult, 2000);

    return () => clearInterval(interval);
  }, [fetchResult]);

  const status = loading
    ? "Connecting"
    : result?.success
      ? "Result received"
      : "Waiting";

  return (
    <main className="min-h-screen bg-[#080a0f] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(59,130,246,0.08),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(239,68,68,0.06),transparent_28%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/[0.08]">
              <span className="text-lg">⚠</span>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                React2Shell
              </h1>
              <p className="mt-0.5 text-sm text-zinc-500">
                Remote Code Execution Demonstration
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-sm text-zinc-500">Live Lab</span>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center py-6 lg:py-8">
          <section className="mb-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-200">
                  CVE-2025-55182
                </span>
                <span className="text-sm font-medium text-slate-300">
                  Next.js
                </span>
              </div>

              <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white lg:text-5xl">
                Server-side execution,
                <br />
                <span className="text-slate-300">made observable.</span>
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
                A controlled academic demonstration showing how a vulnerability
                in a Next.js application can allow untrusted input to influence
                server-side processing and potentially lead to remote code
                execution. The observable result of that execution is displayed
                below within an isolated local application environment.
              </p>
            </div>

            <TeamCard />
          </section>

          <section className="mb-5 flex flex-wrap gap-3">
            <InfoPill label="Target" value="Next.js Application" color="blue" />
            <InfoPill
              label="Address"
              value="localhost:3000"
              color="blue"
              mono
            />
            <InfoPill
              label="Status"
              value={status}
              color={
                loading ? "yellow" : result?.success ? "green" : "yellow"
              }
              pulse={!result?.success}
            />
          </section>

          <section className="min-h-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  Execution Result
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Latest observable result from the Next.js application.
                </p>
              </div>

              {result?.success && (
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
                  <span className="text-sm text-emerald-300">
                    Output received
                  </span>
                </div>
              )}
            </div>

            <CommandOutput
              command={result?.command}
              output={result?.output}
              timestamp={result?.timestamp}
              loading={loading}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function TeamCard() {
  const members = [
    { name: "Pema Wangdi", id: "35204894", initials: "PW" },
    { name: "Pema Loday", id: "35673398", initials: "PL" },
  ];

  return (
    <aside className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018] shadow-xl shadow-black/20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(239,68,68,0.14),transparent_46%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.08),transparent_36%)]" />
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-red-400 via-red-500 to-red-500/30" />

      <div className="relative px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-300/80">
              Course
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
              Computer Security
            </h3>
            <p className="mt-1 font-mono text-xs text-zinc-500">ICT519</p>
          </div>

          <span className="rounded-md border border-red-400/20 bg-red-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-red-200">
            Group member
          </span>
        </div>

        <div className="mt-5 h-px bg-gradient-to-r from-white/15 to-transparent" />

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Presented by
        </p>

        <ul className="mt-3 space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] font-mono text-xs font-semibold text-zinc-200">
                {member.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {member.name}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Student ID</p>
              </div>
              <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs text-zinc-300">
                {member.id}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function InfoPill({
  label,
  value,
  color,
  mono = false,
  pulse = false,
}: {
  label: string;
  value: string;
  color: "green" | "blue" | "yellow";
  mono?: boolean;
  pulse?: boolean;
}) {
  const colorClasses = {
    green: "bg-emerald-400",
    blue: "bg-blue-400",
    yellow: "bg-amber-400",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5">
      <span
        className={`h-2 w-2 rounded-full ${colorClasses[color]} ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      <span className="text-sm text-zinc-500">{label}</span>
      <span
        className={`text-sm font-medium text-zinc-200 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
