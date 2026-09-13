"use client";

// 08/12 — settings modal. Workspace + account sections are real (repo deep
// link, logout); the AI provider section (free tier / OpenRouter / BYOK)
// lands in 12–13. Reachable from the expanded sidebar AND the collapsed icon
// rail, so account actions never require expanding the sidebar.
// Plan: docs/plans/icm-workspace-plan/12-settings.md

import { ExternalLink, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SessionRepo, SessionUser } from "@/lib/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repo: SessionRepo;
  user: SessionUser;
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

export function SettingsModal({
  open,
  onOpenChange,
  repo,
  user,
}: SettingsModalProps) {
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-text">
        <DialogHeader>
          <DialogTitle className="font-heading">Settings</DialogTitle>
          <DialogDescription>
            AI provider, workspace, and account.
          </DialogDescription>
        </DialogHeader>

        {/* TODO(12-settings / 13-llm-provider): free-tier usage meter,
            OpenRouter OAuth, and BYOK go here. */}
        <p className="text-xs text-muted-foreground">
          AI provider options are coming soon — the assistant runs on the free
          tier by default.
        </p>

        <Separator />

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
        </section>

        <Separator />

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
            To fully revoke access: GitHub → Settings →{" "}
            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Applications
            </a>
            .
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
