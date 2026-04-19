"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Clock3,
  Gamepad2,
  QrCode,
  MapPin,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  Send,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    icon: Download,
    title: "Download Aplikasi",
    desc: "Install aplikasi Infinity PS langsung di Android kamu.",
  },
  {
    icon: Clock3,
    title: "Pilih Jam Main",
    desc: "Cek slot real-time dan pilih jam favoritmu.",
  },
  {
    icon: Gamepad2,
    title: "Datang & Main",
    desc: "Tinggal datang ke tempat, login, lalu langsung main.",
  },
];

const benefits = [
  "Booking tanpa antre",
  "Pilih jam real-time",
  "Banyak pilihan game",
  "Tampilan modern dan mudah dipakai",
];

const rooms = [
  { name: "PS5 Room", price: "Rp 50.000", time: "13:00" },
  { name: "PS4 Room", price: "Rp 35.000", time: "15:00" },
  { name: "VIP Room", price: "Rp 75.000", time: "19:00" },
];

const ease = [0.22, 1, 0.36, 1] as const;

const navItems = [
  { id: "fitur", label: "Fitur" },
  { id: "cara-kerja", label: "Cara Kerja" },
  { id: "kontak", label: "Kontak" },
];

const heroLeft = {
  hidden: { opacity: 0, x: -40, filter: "blur(10px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease },
  },
};

const heroUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease },
  },
};

const heroRight = {
  hidden: { opacity: 0, x: 48, filter: "blur(14px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease, delay: 0.12 },
  },
};

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("fitur");
  const [headerHidden, setHeaderHidden] = useState(false);

  const sectionIds = useMemo(() => ["fitur", "cara-kerja", "kontak"], []);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;

      if (currentY > lastY && currentY > 120) {
        setHeaderHidden(true);
      } else {
        setHeaderHidden(false);
      }
      lastY = currentY;

      let currentSection = activeSection;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) {
          currentSection = id;
        }
      }

      setActiveSection(currentSection);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeSection, sectionIds]);

  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <motion.header
        animate={{
          y: headerHidden ? -90 : 0,
          opacity: 1,
        }}
        transition={{ duration: 0.45, ease }}
        className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.22, ease }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25"
            >
              <Gamepad2 className="h-5 w-5" />
            </motion.div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                Infinity PS
              </p>
              <p className="text-xs text-slate-400">
                Booking PS lebih praktis
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="relative rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition"
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? "text-slate-900" : "text-slate-300"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Login Admin
          </Link>
        </div>
      </motion.header>

      <main>
        <section className="relative overflow-hidden bg-slate-950">
          <motion.div
            aria-hidden
            animate={{ opacity: [0.18, 0.26, 0.18], scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-16 top-8 h-80 w-80 rounded-full bg-blue-500 blur-3xl"
          />
          <motion.div
            aria-hidden
            animate={{ opacity: [0.08, 0.13, 0.08], scale: [1, 1.03, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-400 blur-3xl"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_right,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(135deg,_#020617,_#0f172a_55%,_#111827)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <motion.div
              initial="hidden"
              animate="show"
              variants={heroLeft}
              className="flex flex-col justify-center"
            >
              <motion.div
                variants={heroUp}
                className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200"
              >
                <Sparkles className="h-4 w-4" />
                Main PS Lebih Mudah dari Aplikasi
              </motion.div>

              <motion.h1
                variants={heroUp}
                className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                Booking PlayStation jadi lebih cepat, praktis, dan tanpa antre.
              </motion.h1>

              <motion.p
                variants={heroUp}
                className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg"
              >
                Pilih room, atur jam main favoritmu, lalu datang dan langsung
                bermain. Cocok untuk rental PS modern yang ingin tampil lebih
                profesional.
              </motion.p>

              <motion.div
                variants={heroUp}
                className="mt-8 flex flex-col gap-4 sm:flex-row"
              >
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.22, ease }}
                >
                  <Link
                    href="/register"
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-6 text-base font-semibold text-white shadow-xl shadow-blue-700/20 transition hover:bg-blue-500"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download APK
                  </Link>
                </motion.div>

                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.22, ease }}
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  Pindai QR
                </motion.button>
              </motion.div>

              <motion.div
                variants={heroUp}
                className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  Tersedia untuk Android
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-blue-400" />
                  Booking real-time
                </div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-blue-400" />
                  Room PS4 & PS5
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={heroRight}
              className="relative flex items-center justify-center lg:justify-end"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-xl"
              >
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
                  <div className="grid min-h-[520px] gap-4 rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-white">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
                          <Gamepad2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-300">Infinity PS App</p>
                          <p className="font-semibold">Booking Sekarang</p>
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
                        Online
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-blue-500/10 to-white/5 p-4">
                      <div className="grid grid-cols-[1fr_180px] gap-4 sm:grid-cols-[1fr_220px]">
                        <div className="flex flex-col justify-between rounded-[1.25rem] bg-white/10 p-4 backdrop-blur">
                          <div>
                            <p className="text-sm text-slate-300">Featured Setup</p>
                            <h3 className="mt-2 text-2xl font-bold text-white">
                              PS5 Room
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                              Suasana gaming modern, pencahayaan biru, dan setup
                              nyaman untuk mabar.
                            </p>
                          </div>
                          <div className="mt-6 flex items-center gap-2 text-sm text-blue-200">
                            Lihat detail room <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>

                        <div className="relative flex items-end justify-center rounded-[1.25rem] bg-gradient-to-b from-white to-slate-200 p-4 shadow-2xl">
                          <div className="absolute left-1/2 top-3 h-2 w-20 -translate-x-1/2 rounded-full bg-slate-300" />
                          <div className="w-full rounded-[1.2rem] border border-slate-200 bg-white p-3 shadow-xl">
                            <div className="mb-3 h-24 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-700 to-slate-900" />
                            <p className="text-sm font-semibold text-slate-900">
                              Booking Sekarang
                            </p>
                            <div className="mt-3 space-y-2">
                              {rooms.map((room, index) => (
                                <motion.div
                                  key={room.name}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.45,
                                    delay: 0.45 + index * 0.08,
                                    ease,
                                  }}
                                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700"
                                >
                                  <span className="font-medium">{room.name}</span>
                                  <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">
                                    {room.time}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ duration: 0.2, ease }}
                              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                            >
                              Booking Sekarang
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ["100+", "Slot booking tiap hari"],
                        ["24/7", "Cek jadwal kapan saja"],
                        ["Fast", "UI simpel dan responsif"],
                      ].map(([title, desc], i) => (
                        <motion.div
                          key={title}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.5,
                            delay: 0.65 + i * 0.08,
                            ease,
                          }}
                          className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur"
                        >
                          <p className="text-2xl font-bold">{title}</p>
                          <p className="mt-1 text-sm text-slate-300">{desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="cara-kerja" className="bg-slate-50 py-20 scroll-mt-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Cara Mudah Main PS
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Cukup tiga langkah sederhana untuk booking dan bermain tanpa
                ribet.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.7, delay: index * 0.08, ease }}
                    whileHover={{ y: -4 }}
                    className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-xl"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="mt-6 flex items-center justify-between gap-4">
                      <h3 className="text-xl font-bold text-slate-900">
                        {step.title}
                      </h3>
                      <span className="text-sm font-semibold text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-3 leading-7 text-slate-600">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="fitur" className="overflow-hidden bg-white py-20 scroll-mt-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Kenapa Harus Booking di Aplikasi?
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Tampilan modern, proses cepat, dan pengalaman yang jauh lebih
                nyaman untuk pelanggan rental PS kamu.
              </p>

              <div className="mt-8 space-y-4">
                {benefits.map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -18, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.6, delay: index * 0.07, ease }}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <Gamepad2 className="h-6 w-6" />
                    </div>
                    <p className="text-lg font-medium text-slate-800">{item}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 26, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.85, ease }}
              className="relative mx-auto w-full max-w-md"
            >
              <div className="absolute inset-0 rounded-full bg-blue-100 blur-3xl" />
              <div className="relative rounded-[3rem] border-[10px] border-slate-900 bg-slate-900 p-3 shadow-2xl">
                <div className="absolute left-1/2 top-3 h-1.5 w-24 -translate-x-1/2 rounded-full bg-slate-700" />
                <div className="overflow-hidden rounded-[2.2rem] bg-white">
                  <div className="bg-gradient-to-br from-slate-950 via-blue-900 to-blue-700 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold">
                        <Gamepad2 className="h-5 w-5" />
                        Infinity PS
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <div className="h-8 w-8 rounded-full bg-white/10" />
                        <div className="h-8 w-8 rounded-full bg-white/10" />
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.5rem] bg-white/10 p-4 backdrop-blur">
                      <div className="h-40 rounded-[1.25rem] bg-gradient-to-br from-slate-800 via-blue-500 to-slate-900" />
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="rounded-[1.5rem] border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">
                          Booking Sekarang
                        </h3>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Live
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {rooms.map((room) => (
                          <div
                            key={room.name}
                            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">
                                {room.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {room.price} / jam
                              </p>
                            </div>
                            <span className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700">
                              {room.time}
                            </span>
                          </div>
                        ))}
                      </div>

                      <motion.button
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.2, ease }}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-blue-500"
                      >
                        Booking Sekarang
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section
          id="kontak"
          className="bg-slate-950 py-20 text-white scroll-mt-28"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">
                Download Sekarang
                <br />
                & Main Tanpa Ribet!
              </h2>
              <p className="mt-4 max-w-lg text-lg leading-8 text-slate-300">
                Tingkatkan pengalaman pelanggan rental PS kamu dengan landing
                page modern dan aplikasi booking yang gampang dipakai.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2, ease }}
                >
                  <Link
                    href="/register"
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-6 text-base font-semibold text-white shadow-lg shadow-blue-800/20 transition hover:bg-blue-500"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download APK
                  </Link>
                </motion.div>

                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2, ease }}
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  Pindai QR
                </motion.button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Gamepad2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Infinity PS</p>
                  <p className="text-sm text-slate-400">
                    Rental PlayStation modern
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-blue-400" />
                  <p>Jl. Contoh Raya No.123, Jakarta</p>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-5 w-5 text-blue-400" />
                  <p>info@example.com</p>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-5 w-5 text-blue-400" />
                  <p>0812-3496-7890</p>
                </div>
              </div>

              <div className="my-8 h-px bg-white/10" />

              <div className="flex flex-col gap-4 text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-blue-400" />
                  Buka Setiap Hari
                </div>
                <div className="font-semibold text-white">10:00 - 22:00</div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {[Globe, MessageCircle, Send].map((Icon, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    whileHover={{ y: -2, scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}