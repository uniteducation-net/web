"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NewsletterFormProps {
  /** inline: input and button in one row (footer). stacked: input above a
   *  full-width button (updates card). */
  variant?: "inline" | "stacked";
  emailPlaceholder: string;
  submitLabel: string;
  /** Shown after a successful signup — with double opt-in this should ask
   *  the user to confirm via the email we send. */
  successLabel: string;
  errorLabel: string;
  className?: string;
}

type Status = "idle" | "pending" | "success" | "error";

/** Shared newsletter signup form. Posts to /api/newsletter, which forwards
 *  to Acumbamail's incoming webhook — the provider URL never reaches the
 *  client. */
const NewsletterForm = ({
  variant = "inline",
  emailPlaceholder,
  submitLabel,
  successLabel,
  errorLabel,
  className,
}: NewsletterFormProps) => {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || status === "pending") return;
    // Read the honeypot before the first await — currentTarget is nulled
    // once the handler goes async.
    const company = new FormData(event.currentTarget).get("company");
    setStatus("pending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: company ?? "" }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className={cn(
          "rounded-xl bg-muted px-4 py-3 text-sm font-medium",
          className,
        )}
      >
        {successLabel}
      </div>
    );
  }

  const emailInput = (
    <Input
      type="email"
      required
      placeholder={emailPlaceholder}
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      aria-label={emailPlaceholder}
    />
  );
  // Bots fill every field; humans never see this one. The API fakes success
  // and forwards nothing when it arrives filled.
  const honeypot = (
    <input
      type="text"
      name="company"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute -left-[9999px] size-0 opacity-0"
    />
  );
  const error = status === "error" && (
    <p role="alert" className="text-xs font-medium text-destructive">
      {errorLabel}
    </p>
  );

  if (variant === "stacked") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn("flex flex-col gap-3", className)}
      >
        {emailInput}
        {honeypot}
        <Button
          type="submit"
          disabled={status === "pending"}
          className="w-full"
        >
          {submitLabel}
        </Button>
        {error}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("grid gap-1.5", className)}>
      <div className="flex w-full items-center space-x-2">
        {emailInput}
        {honeypot}
        <Button type="submit" disabled={status === "pending"}>
          {submitLabel}
        </Button>
      </div>
      {error}
    </form>
  );
};

export { NewsletterForm };
