"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CommandOutputProps = {
  command?: string;
  output?: string;
  timestamp?: string;
  loading?: boolean;
};

function parseKeyValueOutput(output: string) {
  const matches = [...output.matchAll(/([a-zA-Z_]+)=([^\s]+)/g)];

  if (matches.length < 2) {
    return null;
  }

  return matches.map((match) => ({
    key: match[1],
    value: match[2],
  }));
}

function ordinal(day: number) {
  const remainder = day % 10;
  const tens = day % 100;

  if (tens >= 11 && tens <= 13) return `${day}th`;
  if (remainder === 1) return `${day}st`;
  if (remainder === 2) return `${day}nd`;
  if (remainder === 3) return `${day}rd`;
  return `${day}th`;
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  const day = ordinal(date.getDate());
  const month = date.toLocaleString("en-GB", { month: "short" });
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${day} ${month} at ${time}`;
}

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function useReveal(command: string, output: string, token: string | null) {
  const [typedCommand, setTypedCommand] = useState("");
  const [typedOutput, setTypedOutput] = useState("");
  const [phase, setPhase] = useState<"idle" | "command" | "output" | "done">(
    "idle"
  );

  useEffect(() => {
    if (!token) {
      setTypedCommand("");
      setTypedOutput("");
      setPhase("idle");
      return;
    }

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setTypedCommand(command);
      setTypedOutput(output);
      setPhase("done");
      return;
    }

    let cancelled = false;

    async function run() {
      setTypedCommand("");
      setTypedOutput("");
      setPhase("command");

      for (let i = 1; i <= command.length; i += 1) {
        if (cancelled) return;
        setTypedCommand(command.slice(0, i));
        await sleep(22);
      }

      await sleep(140);
      if (cancelled) return;

      setPhase("output");

      const speed = Math.max(
        7,
        Math.min(18, Math.floor(1200 / Math.max(output.length, 1)))
      );

      for (let i = 1; i <= output.length; i += 1) {
        if (cancelled) return;
        setTypedOutput(output.slice(0, i));
        await sleep(speed);
      }

      if (cancelled) return;
      setPhase("done");
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [command, output, token]);

  return { typedCommand, typedOutput, phase };
}

function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }

    const id = setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [active]);

  return seconds;
}

export default function CommandOutput({
  command = "",
  output = "",
  timestamp,
  loading = false,
}: CommandOutputProps) {
  const [copied, setCopied] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  const hasResult = Boolean(command && output);
  const resultKey = hasResult ? `${command}:${timestamp}` : null;
  const previousKey = useRef<string | null>(null);

  useEffect(() => {
    if (!resultKey) {
      previousKey.current = null;
      return;
    }

    if (previousKey.current === resultKey) {
      return;
    }

    previousKey.current = resultKey;
    setFlashing(true);
    setFlashKey((value) => value + 1);

    const timeout = setTimeout(() => setFlashing(false), 900);
    return () => clearTimeout(timeout);
  }, [resultKey]);

  const { typedCommand, typedOutput, phase } = useReveal(
    command,
    output,
    resultKey
  );

  const waiting = !hasResult;
  const elapsed = useElapsed(waiting && !loading);
  const lines = useMemo(() => output.split(/\r?\n/), [output]);
  const tableRows = useMemo(
    () => parseKeyValueOutput(output.trim()),
    [output]
  );

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(`$ ${command}\n${output}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail silently (e.g. permissions); no-op.
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-[#090c12] shadow-2xl shadow-black/30 ${
        flashing ? "console-flash" : waiting ? "console-idle" : "border-white/10"
      }`}
    >
      {flashing && (
        <div
          key={flashKey}
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent flash-sweep"
        />
      )}

      <div
        className={`h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-700 ${
          flashing ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="border-b border-white/10 bg-white/[0.025] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>

            <div className="h-5 w-px bg-white/10" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Execution Console
              </p>
              <p className="mt-0.5 font-mono text-xs text-zinc-600">
                {waiting
                  ? loading
                    ? "connecting…"
                    : "waiting for result"
                  : "result received"}
              </p>
            </div>
          </div>

          {hasResult && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
            >
              {copied ? (
                <>
                  <CheckIcon />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon />
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid border-b border-white/10 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:p-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Command
          </p>
          <div className="flex min-h-[1.75rem] items-start gap-3">
            <span className="select-none font-mono text-lg text-emerald-400">
              $
            </span>
            <code className="break-all font-mono text-lg leading-7 text-zinc-100">
              {waiting ? (
                <Caret />
              ) : (
                <>
                  {typedCommand}
                  {phase === "command" && <Caret />}
                </>
              )}
            </code>
          </div>
        </div>

        <div className="p-5 lg:p-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            {waiting ? "Status" : "Received"}
          </p>
          <p className="font-mono text-sm leading-7 text-zinc-400">
            {waiting
              ? loading
                ? "Connecting to lab…"
                : `Listening ${formatElapsed(elapsed)}`
              : formatTimestamp(timestamp)}
          </p>
        </div>
      </div>

      <div className="relative p-5 sm:p-6">
        {waiting ? (
          <WaitingBody loading={loading} />
        ) : (
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                Command result
              </p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
                <span className="text-xs text-emerald-300">
                  {phase === "done" || tableRows ? "Received" : "Writing…"}
                </span>
              </div>
            </div>

            {tableRows && phase !== "command" ? (
              <ResultTable rows={tableRows} />
            ) : (
              <ResultText
                text={phase === "done" ? output : typedOutput}
                typing={phase === "output"}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-white/10 bg-white/[0.015] px-5 py-4 text-xs text-zinc-600 sm:flex-row sm:items-center sm:px-6">
        <span>
          {waiting
            ? "The console is live. Command output will appear here."
            : "Output is displayed as received from the controlled lab."}
        </span>
        <span className="font-mono">
          {waiting
            ? "0 lines · 0 characters"
            : `${lines.length} ${lines.length === 1 ? "line" : "lines"} · ${
                output.length
              } characters`}
        </span>
      </div>
    </div>
  );
}

function Caret() {
  return (
    <span
      className="caret ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[0.12em] rounded-[1px] bg-emerald-400 align-middle shadow-[0_0_10px_rgba(52,211,153,0.95)]"
      aria-hidden
    />
  );
}

function WaitingBody({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-[200px] flex-col justify-center">
      <p className="font-mono text-base text-zinc-500">
        {loading
          ? "establishing result channel…"
          : "awaiting server-side execution…"}
      </p>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
        When a command runs on the target, its result is typed into this
        console.
      </p>
    </div>
  );
}

function ResultTable({
  rows,
}: {
  rows: { key: string; value: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04]">
            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Field
            </th>
            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.key}-${row.value}`}
              className="border-b border-white/[0.06] last:border-b-0"
            >
              <td className="px-5 py-3.5 font-mono text-sm text-zinc-400">
                {row.key}
              </td>
              <td
                className="break-all px-5 py-3.5 font-mono text-base text-zinc-100"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultText({
  text,
  typing,
}: {
  text: string;
  typing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-5 sm:px-6">
      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-zinc-100 sm:text-base">
        {text || " "}
        {typing && <Caret />}
        {!typing && text && <Caret />}
      </pre>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
