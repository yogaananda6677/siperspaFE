"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

const consoles = [
  {
    title: "PlayStation 5 (PS 5)\nDigital Edition",
    price: "Rp. 10.000/jam",
    image: "/QdHnn-removebg-preview.png",
  },
  {
    title: "PlayStation 5 (PS 5)\nDigital Edition",
    price: "Rp. 5.000/jam",
    image: "/image-removebg-preview.png",
  },
  {
    title: "PlayStation 5 (PS 5)\nDigital Edition",
    price: "Rp. 5.000/jam",
    image: "/dbVcR-removebg-preview.png",
  },
];

const benefits = [
  { title: "Tanpa Antri",        desc: "Pesan sekarang, main sekarang", icon: "🎮" },
  { title: "Pilih Jam Real Time", desc: "Booking cepat & akurat",        icon: "🕒" },
  { title: "Banyak Pilihan Game", desc: "Pilih game sesukamu",           icon: "🎯" },
  { title: "Tempat Nyaman",       desc: "Tempat bersih dan modern",      icon: "🛋️" },
];

const steps = [
  {
    number: "1.",
    title: "Download\nAplikasi",
    desc: "Instal aplikasi RentalPS di Play Store untuk mulai booking dengan mudah",
  },
  {
    number: "2.",
    title: "Pilih Jam\nMain",
    desc: "Pilih jam sesuai keinginan dan lihat ketersediaan secara real-time",
  },
  {
    number: "3.",
    title: "Datang dan\nMain",
    desc: "Datang sesuai jadwal booking dan langsung nikmati sesi gaming",
  },
];

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="page-shell">
      <div className="page-card">
        {/* NAVBAR */}
        <nav className="navbar">
          <div className="navbar-logo">
            <Image
              src="/infinity.png"
              alt="Infinity PS"
              width={320}
              height={96}
              priority
              className="header-logo"
            />
          </div>
          <Link href="/login" className="login-button">
            Login
          </Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-background">
            <Image
              src="/YFvMB.jpg"
              alt="Gaming room background"
              fill
              className="hero-background-image"
              priority
            />
          </div>

          <div className="hero-overlay" />

          <div className="hero-content">
            <div className="hero-left">
              <h1>
                Main PS Lebih Mudah,
                <br />
                Booking Dari Aplikasi
              </h1>

              <p>
                Main PlayStation jadi lebih mudah dan cepat
                <br />
                Pilih waktu senggangmu tanpa perlu antri
              </p>

              <Link href="#" className="apk-button">
                <span className="apk-icon">▶</span>
                Download APK
              </Link>

              <span className="hero-note">*Hanya Untuk Android</span>
            </div>
          </div>
        </section>

        {/* CONSOLES */}
        <section className="section consoles-section">
          <div className="section-title-wrap reveal">
            <h2>Konsol Yang Tersedia</h2>
            <p>Nikmati berbagai pilihan PlayStation terbaik sesuai gaya bermainmu.</p>
          </div>

          <div className="console-grid">
            {consoles.map((item, i) => (
              <article
                className={`console-card reveal reveal-delay-${i + 1}`}
                key={item.image}
              >
                <div className="console-image-wrap">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={145}
                    height={120}
                    className="console-image"
                  />
                </div>

                <div className="console-info">
                  <h3>
                    {item.title.split("\n").map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </h3>
                  <small>Harga Sewa</small>
                  <strong>{item.price}</strong>
                  <button type="button">Sewa Sekarang!</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SOFT / BENEFIT SECTION */}
        <section className="section soft-section">
          <div className="soft-bg" />

          <div className="phone-wrapper">
            <Image
              src="/xMHqI-removebg-preview.png"
              alt="Mobile app preview"
              width={760}
              height={1000}
              className="phone-image"
            />
          </div>

          <h2 className="soft-heading reveal">Kenapa Harus Pakai Aplikasi?</h2>

          <div className="benefit-grid">
            {benefits.map((item, i) => (
              <article
                className={`benefit-card reveal reveal-delay-${i + 1}`}
                key={item.title}
              >
                <div className="benefit-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="steps-block">
            <h2 className="reveal">Cara Mudah Main PS</h2>

            <div className="steps-grid">
              {steps.map((step, i) => (
                <article
                  className={`step-card reveal reveal-delay-${i + 1}`}
                  key={step.number}
                >
                  <div className="step-number">{step.number}</div>
                  <div className="step-content">
                    <h3>
                      {step.title.split("\n").map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </h3>
                    <p>{step.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section cta-section">
          <div className="cta-box">
            <div className="cta-left">
              <h2>
                Downlad Sekarang
                <br />
                &amp; Main Tanpa Ribet
              </h2>

              <Link href="#" className="apk-button">
                <span className="apk-icon">▶</span>
                Download APK
              </Link>
            </div>

            <div className="cta-right">
              <Image
                src="/infinity.png"
                alt="Infinity PS"
                width={220}
                height={68}
                className="footer-logo"
              />

              <div className="footer-address">
                <div className="cta-address-row">
                  <span className="cta-icon">📍</span>
                  <p>Tawang, Kec. Wates, Kabupaten Kediri, Jawa timur 64174</p>
                </div>

                <div className="cta-phone-row">
                  <span className="cta-icon">☎</span>
                  <p>0859-6714-5524</p>
                </div>
              </div>

              <div className="footer-line" />

              <div className="footer-meta">
                <div className="cta-meta-row">
                  <span className="cta-icon">ⓘ</span>
                  <span>Buka Setiap Hari</span>
                </div>

                <div className="cta-meta-row">
                  <span className="cta-icon">🕒</span>
                  <span>09.00 - 02.00 WIB</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
