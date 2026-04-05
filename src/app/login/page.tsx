"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login({ username: form.username, password: form.password });
      
      // ✅ Simpan token & user ke localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Redirect berdasarkan role
      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 dark:bg-white mb-4">
              <svg className="w-6 h-6 text-white dark:text-zinc-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Masuk</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Masukkan email dan password kamu</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                name="username"
                placeholder="john_doe"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition focus:border-zinc-900 dark:focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-300/10"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition focus:border-zinc-900 dark:focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-300/10"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 transition hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Belum punya akun?{" "}
              <a href="/register" className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">Daftar</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}