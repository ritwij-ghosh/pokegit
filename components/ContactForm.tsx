"use client";

import { useState } from "react";

import { COPY } from "@/lib/copy";

type Status = "idle" | "pending" | "success" | "error";

const DEFAULT_SUBJECT = COPY.contact.subjectPlaceholder;

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  function clearFeedback() {
    if (fieldError) setFieldError(null);
    if (status !== "idle" && status !== "pending") setStatus("idle");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim() || DEFAULT_SUBJECT;
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setFieldError("Enter your name.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldError("Enter a valid reply-to email.");
      return;
    }
    if (!trimmedMessage) {
      setFieldError("Write a short message.");
      return;
    }

    setFieldError(null);
    setStatus("pending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject,
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
          {COPY.contact.nameLabel}
        </span>
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            clearFeedback();
          }}
          autoComplete="name"
          maxLength={80}
          placeholder={COPY.contact.namePlaceholder}
          className="gba-field w-full px-3 py-2.5 font-card text-base tracking-normal text-[var(--foreground)]
                     placeholder:text-[var(--muted)]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
          {COPY.contact.emailLabel}
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFeedback();
          }}
          autoComplete="email"
          maxLength={160}
          placeholder={COPY.contact.emailPlaceholder}
          className="gba-field w-full px-3 py-2.5 font-card text-base tracking-normal text-[var(--foreground)]
                     placeholder:text-[var(--muted)]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
          {COPY.contact.subjectLabel}
        </span>
        <input
          value={subject}
          onChange={(event) => {
            setSubject(event.target.value);
            clearFeedback();
          }}
          maxLength={120}
          placeholder={COPY.contact.subjectPlaceholder}
          className="gba-field w-full px-3 py-2.5 font-card text-base tracking-normal text-[var(--foreground)]
                     placeholder:text-[var(--muted)]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
          {COPY.contact.messageLabel}
        </span>
        <textarea
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            clearFeedback();
          }}
          rows={6}
          maxLength={4000}
          placeholder={COPY.contact.messagePlaceholder}
          className="gba-field w-full resize-y px-3 py-2.5 font-card text-base leading-relaxed
                     tracking-normal text-[var(--foreground)] placeholder:text-[var(--muted)]"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={status === "pending"}
          className="gba-btn gba-btn-primary shrink-0 px-4 py-3 font-display text-[0.6rem]
                     uppercase"
        >
          {status === "pending" ? (
            <span className="dex-blink">{COPY.contact.submitPending}</span>
          ) : (
            COPY.contact.submitIdle
          )}
        </button>

        <p className="min-h-5 font-card text-sm leading-relaxed tracking-normal" aria-live="polite">
          {fieldError ? (
            <span className="text-[var(--pokedex-red)]">{fieldError}</span>
          ) : status === "success" ? (
            <span className="text-[var(--accent)]">{COPY.contact.success}</span>
          ) : status === "error" ? (
            <span className="text-[var(--pokedex-red)]">{COPY.contact.error}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
