"use client";

// 12 — settings modal, fully wired. One Dialog, three sections:
//   1. AI provider — gateway free tier / OpenRouter OAuth (PKCE) / BYOK,
//      persisted into the encrypted session cookie via /api/settings (12
//      step 5). Keys are write-only: the UI never shows more than the last 4
//      characters. Includes the fair-use meter for the free tier (12 step 6).
//   2. Workspace — repo deep link, template credit, and "Use a different
//      repository…": AlertDialog confirmation → repo picker (only repos the
//      installation covers) → cookie update. Instant and reversible.
//   3. Account — avatar + login, unpair/logout, revoke fine print.
// Reachable from the expanded sidebar AND the collapsed icon rail.
// Plan: docs/plans/icm-workspace-plan/12-settings.md

import { useEffect, useState } from "react";
import { Check, ExternalLink, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ByokProvider, SessionRepo, SessionUser } from "@/lib/session";
import { Loader } from "@/components/ai-elements/loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

/** sessionStorage key for the PKCE verifier across the OpenRouter bounce —
 *  read by the workspace shell when the flow lands back on /workspace?code=… */
export const OPENROUTER_VERIFIER_KEY = "openrouter-verifier";

type ProviderChoice = "gateway" | "openrouter" | "byok";

/** Client-safe view returned by /api/settings — never contains full keys. */
interface SettingsData {
  provider: ProviderChoice;
  byokProvider: ByokProvider | null;
  byokKeyLast4: string | null;
  /** Effective model id + the curated choices for the active provider (13
   *  step 3) — the list changes when the provider changes. */
  model: string;
  modelOptions: string[];
  fairUse: { tokens: number; limit: number };
}

interface RepoEntry {
  owner: string;
  name: string;
  description: string | null;
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repo: SessionRepo;
  user: SessionUser;
  /** Called after a successful workspace switch so the shell can re-render
   *  from the guard down (router.refresh) and re-fetch tree + preview. */
  onRepoChanged?: () => void;
}

function initials(user: SessionUser): string {
  const source = user.name ?? user.login;
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

async function logout(router: ReturnType<typeof useRouter>) {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // offline — clear locally anyway
  }
  try {
    localStorage.clear();
  } catch {
    // storage unavailable — nothing to clear
  }
  router.replace("/workspace/start");
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * 12 step 2 / 13 step 4 — OpenRouter OAuth PKCE, client-side: stash the
 * verifier in sessionStorage, bounce to OpenRouter's consent page. The return
 * to /workspace?code=… is handled by the workspace shell.
 */
async function connectOpenRouter() {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64url(verifierBytes);
  const challenge = base64url(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
    ),
  );
  try {
    sessionStorage.setItem(OPENROUTER_VERIFIER_KEY, verifier);
  } catch {
    return; // storage blocked — the round-trip can't complete, stay put
  }
  const params = new URLSearchParams({
    callback_url: `${window.location.origin}/workspace`,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  window.location.assign(`https://openrouter.ai/auth?${params.toString()}`);
}

export function SettingsModal({
  open,
  onOpenChange,
  repo,
  user,
  onRepoChanged,
}: SettingsModalProps) {
  const router = useRouter();
  const [data, setData] = useState<SettingsData | null>(null);
  const [selected, setSelected] = useState<ProviderChoice>("gateway");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BYOK form
  const [byokProvider, setByokProvider] = useState<ByokProvider>("openai");
  const [byokKey, setByokKey] = useState("");

  // Workspace switcher
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [repos, setRepos] = useState<RepoEntry[] | null>(null);
  const [installationUrl, setInstallationUrl] = useState<string | null>(null);
  const [reposError, setReposError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  // Load the settings view every time the modal opens — the fair-use meter
  // moves after agent calls, so a fresh read keeps it honest.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error(`settings load failed: ${res.status}`);
        const next = (await res.json()) as SettingsData;
        if (cancelled) return;
        setData(next);
        setSelected(next.provider);
        setByokProvider(next.byokProvider ?? "openai");
        setError(null);
      } catch {
        if (!cancelled) setError("Couldn't load settings — try reopening.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  /** POST a settings change; on success the response IS the new safe view. */
  async function postSettings(
    body: Record<string, unknown>,
  ): Promise<SettingsData | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`settings save failed: ${res.status}`);
      const next = (await res.json()) as SettingsData;
      setData(next);
      return next;
    } catch {
      setError("Couldn't save — please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function selectProvider(next: ProviderChoice) {
    const previous = data?.provider ?? "gateway";
    setSelected(next);
    if (next === "gateway") {
      // Free tier: clear whichever key is active. Just a cookie update —
      // reconnecting is one click, so nothing is really lost.
      const cleared =
        previous === "byok"
          ? await postSettings({ clearByok: true })
          : previous === "openrouter"
            ? await postSettings({ clearOpenrouter: true })
            : null;
      if (previous !== "gateway" && !cleared) setSelected(previous);
    } else if (next === "openrouter" && previous !== "openrouter") {
      void connectOpenRouter(); // navigates away; shell handles the return
    }
    // "byok" only reveals the form — it takes effect on Save.
  }

  async function saveByok() {
    const key = byokKey.trim();
    if (!key || busy) return;
    const next = await postSettings({ byokProvider, byokKey: key });
    if (next) setByokKey(""); // never keep the plaintext around
  }

  /** 13 step 3 — the tiny curated model picker; choice lives in the cookie. */
  async function selectModel(model: string) {
    if (!data || model === data.model || busy) return;
    await postSettings({ model });
  }

  async function disconnectOpenrouter() {
    const next = await postSettings({ clearOpenrouter: true });
    if (next) setSelected("gateway");
  }

  async function openPicker() {
    setPickerOpen(true);
    setRepos(null);
    setReposError(null);
    try {
      const res = await fetch("/api/settings/repos", { cache: "no-store" });
      if (!res.ok) throw new Error(`repos load failed: ${res.status}`);
      const body = (await res.json()) as {
        repos: RepoEntry[];
        installationUrl: string | null;
      };
      setRepos(body.repos);
      setInstallationUrl(body.installationUrl);
    } catch {
      setReposError("Couldn't load your repositories — try again.");
    }
  }

  async function switchRepo(target: RepoEntry) {
    if (switching) return;
    if (target.owner === repo.owner && target.name === repo.name) return;
    setSwitching(true);
    setReposError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: { owner: target.owner, name: target.name } }),
      });
      if (!res.ok) throw new Error(`repo switch failed: ${res.status}`);
      setPickerOpen(false);
      onOpenChange(false);
      onRepoChanged?.();
    } catch {
      setReposError(
        "Couldn't switch — that repository may not be granted to the app yet.",
      );
    } finally {
      setSwitching(false);
    }
  }

  const fairUsePercent = data
    ? Math.min(100, Math.round((data.fairUse.tokens / data.fairUse.limit) * 100))
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] max-w-md overflow-y-auto font-text">
          <DialogHeader>
            <DialogTitle className="font-heading">Settings</DialogTitle>
            <DialogDescription>
              AI provider, workspace, and account.
            </DialogDescription>
          </DialogHeader>

          {/* Section 1 — AI provider (12 step 2) */}
          <section className="flex flex-col gap-3">
            <h3 className="font-heading text-sm font-semibold text-secondary">
              AI provider
            </h3>
            <RadioGroup
              value={selected}
              onValueChange={(value) =>
                void selectProvider(value as ProviderChoice)
              }
              className="flex flex-col gap-3"
              disabled={busy}
            >
              <label className="flex items-start gap-2.5">
                <RadioGroupItem value="gateway" className="mt-0.5" />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Use our free AI</span>
                  <span className="text-xs text-muted-foreground">
                    Powered by the NGO. Fair-use limits apply.
                  </span>
                  {fairUsePercent !== null && (
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full bg-primary"
                          style={{ width: `${fairUsePercent}%` }}
                        />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fairUsePercent}% today · resets daily
                      </span>
                    </span>
                  )}
                </span>
              </label>

              <label className="flex items-start gap-2.5">
                <RadioGroupItem value="openrouter" className="mt-0.5" />
                <span className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">Connect OpenRouter</span>
                  <span className="flex items-center gap-2">
                    {data?.provider === "openrouter" ? (
                      <>
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <Check className="size-3.5" />
                          Connected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void disconnectOpenrouter()}
                          disabled={busy}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void connectOpenRouter()}
                        disabled={busy}
                      >
                        Connect
                      </Button>
                    )}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5">
                <RadioGroupItem value="byok" className="mt-0.5" />
                <span className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">
                    Use my own API key
                  </span>
                  {data?.provider === "byok" && data.byokKeyLast4 && (
                    <span className="text-xs text-muted-foreground">
                      Saved key: sk-…{data.byokKeyLast4}
                    </span>
                  )}
                  {selected === "byok" && (
                    <span className="flex flex-wrap items-center gap-2">
                      <Select
                        value={byokProvider}
                        onValueChange={(value) =>
                          setByokProvider(value as ByokProvider)
                        }
                      >
                        <SelectTrigger className="w-32" size="sm">
                          <SelectValue placeholder="Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="password"
                        placeholder="sk-…"
                        className="w-40"
                        autoComplete="off"
                        value={byokKey}
                        onChange={(e) => setByokKey(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void saveByok()}
                        disabled={busy || !byokKey.trim()}
                      >
                        Save
                      </Button>
                    </span>
                  )}
                </span>
              </label>
            </RadioGroup>
            {/* 13 step 3 — model picker: 2–3 curated cheap models for the
                active provider; the first (cheapest) is the default. */}
            {data && data.modelOptions.length > 0 && (
              <div className="flex items-center gap-2 pl-6">
                <span className="text-xs text-muted-foreground">Model</span>
                <Select
                  value={data.model}
                  onValueChange={(value) => void selectModel(value)}
                  disabled={busy}
                >
                  <SelectTrigger className="w-56" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.modelOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        <span className="font-mono text-xs">{option}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </section>

          <Separator />

          {/* Section 2 — Workspace (12 step 3) */}
          <section className="flex flex-col gap-2">
            <h3 className="font-heading text-sm font-semibold text-secondary">
              Workspace
            </h3>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm">
                {repo.owner}/{repo.name}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={`https://github.com/${repo.owner}/${repo.name}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                  Open on GitHub
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Workspace created from the{" "}
              <a
                href="https://github.com/RinDig/Interpretable-Context-Methodology"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                ICM teacher template
              </a>
              .
            </p>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(true)}
              >
                Use a different repository…
              </Button>
            </div>
          </section>

          <Separator />

          {/* Section 3 — Account (12 step 4) */}
          <section className="flex flex-col gap-2">
            <h3 className="font-heading text-sm font-semibold text-secondary">
              Account
            </h3>
            <div className="flex items-center gap-2.5">
              <Avatar className="size-8">
                <AvatarImage
                  src={user.avatarUrl}
                  alt={user.name ?? user.login}
                />
                <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                  {initials(user)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{user.login}</span>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout(router)}
              >
                <LogOut className="size-3.5" />
                Unpair GitHub / Log out
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              To fully revoke access: GitHub → Settings → Applications → GitHub
              Apps →{" "}
              <a
                href="https://github.com/settings/installations"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                uninstall
              </a>
              .
            </p>
          </section>
        </DialogContent>
      </Dialog>

      {/* 12 step 3 — confirmation blocks accidents; nothing is ever deleted. */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="font-text">
          <AlertDialogHeader>
            <AlertDialogTitle>Switch workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Nothing is deleted — your current workspace stays on GitHub and
              you can switch back anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void openPicker()}>
              Choose repository
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Repo picker — only repos the installation covers (12 step 3). */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md font-text">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Choose a repository
            </DialogTitle>
            <DialogDescription>
              Only repositories granted to the UnitEd app are listed.
            </DialogDescription>
          </DialogHeader>
          {reposError && (
            <p className="text-xs text-destructive">{reposError}</p>
          )}
          {!repos && !reposError ? (
            <div className="flex justify-center py-6">
              <Loader size={18} />
            </div>
          ) : (
            repos && (
              <ScrollArea className="max-h-64">
                <ul className="flex flex-col">
                  {repos.map((entry) => {
                    const isCurrent =
                      entry.owner === repo.owner && entry.name === repo.name;
                    return (
                      <li key={`${entry.owner}/${entry.name}`}>
                        <button
                          type="button"
                          disabled={switching || isCurrent}
                          onClick={() => void switchRepo(entry)}
                          className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left hover:bg-accent disabled:opacity-60"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-mono text-sm">
                              {entry.owner}/{entry.name}
                            </span>
                            {entry.description && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {entry.description}
                              </span>
                            )}
                          </span>
                          {isCurrent && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              current
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )
          )}
          {installationUrl && (
            <p className="text-xs text-muted-foreground">
              Don&apos;t see your repository?{" "}
              <a
                href={installationUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Grant it to the app
              </a>{" "}
              first, then retry.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
