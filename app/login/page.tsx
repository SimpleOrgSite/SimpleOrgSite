"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <input name="email" type="email" placeholder="Email" required className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-4 focus:ring-gray-900/5" />
        <input name="password" type="password" placeholder="Password" required className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-4 focus:ring-gray-900/5" />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50">
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
