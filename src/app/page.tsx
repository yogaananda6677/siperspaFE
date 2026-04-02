import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4">
      <main className="w-full max-w-lg flex flex-col items-center text-center gap-8 py-20">
        {/* Logo */}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={120}
          height={24}
          priority
        />

        {/* Heading */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Selamat Datang
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
            Mulai perjalananmu. Daftar atau masuk untuk mengakses aplikasi.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white px-6 text-sm font-semibold text-white dark:text-zinc-900 transition hover:bg-zinc-700 dark:hover:bg-zinc-100"
          >
            Daftar Sekarang
          </Link>
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 text-sm font-semibold text-zinc-900 dark:text-zinc-50 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Masuk
          </Link>
        </div>

        {/* Footer links */}
        <div className="flex gap-5 text-xs text-zinc-400 dark:text-zinc-600">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition"
          >
            Dokumentasi
          </a>
          <a
            href="https://vercel.com/templates?framework=next.js"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition"
          >
            Templates
          </a>
          <a
            href="https://nextjs.org/learn"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition"
          >
            Belajar
          </a>
        </div>
      </main>
    </div>
  );
}