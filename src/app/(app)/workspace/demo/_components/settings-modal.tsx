"use client";

import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-text">
        <DialogHeader>
          <DialogTitle className="font-heading">Settings</DialogTitle>
          <DialogDescription>
            AI provider, workspace, and account.
          </DialogDescription>
        </DialogHeader>

        <section className="flex flex-col gap-3">
          <h3 className="font-heading text-sm font-semibold text-secondary">
            AI provider
          </h3>
          <RadioGroup defaultValue="free" className="flex flex-col gap-3">
            <label className="flex items-start gap-2.5">
              <RadioGroupItem value="free" className="mt-0.5" />
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">Use our free AI</span>
                <span className="text-xs text-muted-foreground">
                  Powered by the NGO. Fair-use limits apply.
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full w-[23%] bg-primary" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    23% today · resets daily
                  </span>
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2.5">
              <RadioGroupItem value="openrouter" className="mt-0.5" />
              <span className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Connect OpenRouter</span>
                <span>
                  <Button variant="outline" size="sm" disabled>
                    Connect
                  </Button>
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2.5">
              <RadioGroupItem value="byok" className="mt-0.5" />
              <span className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Use my own API key</span>
                <span className="flex gap-2">
                  <Select disabled>
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
                    disabled
                  />
                  <Button variant="outline" size="sm" disabled>
                    Save
                  </Button>
                </span>
              </span>
            </label>
          </RadioGroup>
        </section>

        <Separator />

        <section className="flex flex-col gap-2">
          <h3 className="font-heading text-sm font-semibold text-secondary">
            Workspace
          </h3>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm">anarivera/icm-workspace</span>
            <Button variant="ghost" size="sm" asChild>
              <a href="#" onClick={(e) => e.preventDefault()}>
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
        </section>

        <Separator />

        <section className="flex flex-col gap-2">
          <h3 className="font-heading text-sm font-semibold text-secondary">
            Account
          </h3>
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                AR
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">@anarivera</span>
          </div>
          <div>
            <Button variant="outline" size="sm" disabled>
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
