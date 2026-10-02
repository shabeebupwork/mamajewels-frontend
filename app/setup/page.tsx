"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("Use a password with at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/accept-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "This setup link is invalid or expired.");
        return;
      }
      window.location.replace("/");
    } catch {
      setError("Unable to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen place-items-center bg-[#f7f7f8] p-5">
    <section className="w-full max-w-md rounded-xl border border-[#e5e1e7] bg-white p-7 shadow-sm sm:p-9">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-[#21152a] text-[#f7a8c4]"><Sparkles className="size-5" /></span>
        <div><p className="font-semibold">MamaJewels</p><p className="text-xs text-[#8b838e]">Team account setup</p></div>
      </div>
      <div className="mt-8 grid size-11 place-items-center rounded-lg bg-[#f6e7ee] text-[#783b59]"><KeyRound className="size-5" /></div>
      <h1 className="mt-5 text-xl font-semibold">Set your password</h1>
      <p className="mt-2 text-sm leading-6 text-[#746c77]">Choose a password to activate your dashboard account. This setup link can only be used once.</p>
      {!token ? <p className="mt-5 rounded-md bg-[#fff2f2] p-3 text-sm text-[#a33442]">This setup link is missing its token.</p> : <form className="mt-6 space-y-4" onSubmit={submit}>
        <div className="grid gap-2"><Label htmlFor="setup-password">Password</Label><Input id="setup-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
        <div className="grid gap-2"><Label htmlFor="setup-confirmation">Confirm password</Label><Input id="setup-confirmation" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
        {error ? <p role="alert" className="text-sm text-[#a33442]">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full bg-[#632b4a] text-white hover:bg-[#4e203a]">{loading ? "Setting up account…" : "Activate account"}</Button>
      </form>}
    </section>
  </main>;
}
