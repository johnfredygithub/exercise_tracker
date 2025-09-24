"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { FiActivity, FiTrendingUp, FiRepeat, FiCalendar } from "react-icons/fi";
import Link from "next/link";

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animación inicial
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );
    }
    if (cardsRef.current.length > 0) {
      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    }
    if (videoRef.current) {
      gsap.fromTo(
        videoRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 1, delay: 0.5, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen animated-gradient text-white overflow-hidden">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="flex flex-col items-center justify-center text-center py-24 px-6"
      >
        <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-lg">
          ExerciseTrackerFree
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/90">
          Lleva un control preciso de tus repeticiones y progreso diario con una
          interfaz moderna,fácil de usar y GRATIS.
        </p>
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link
            href="/api/auth/signin?csrf=true"
            className="mt-6 inline-block bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-yellow-300 transition cursor-pointer"
          >
            Empezar ahora
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <motion.div
          ref={(el) => {
            if (el && !cardsRef.current.includes(el)) {
              cardsRef.current.push(el);
            }
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl flex flex-col items-center"
        >
          <FiActivity className="text-5xl mb-3" />
          <h3 className="text-xl font-bold">Seguimiento Diario</h3>
          <p className="text-sm text-white/80 text-center mt-2">
            Registra tus repeticiones cada día y no pierdas tu progreso.
          </p>
        </motion.div>

        <motion.div
          ref={(el) => {
            if (el && !cardsRef.current.includes(el)) {
              cardsRef.current.push(el);
            }
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl flex flex-col items-center"
        >
          <FiRepeat className="text-5xl mb-3" />
          <h3 className="text-xl font-bold">Historial de Ejercicios</h3>
          <p className="text-sm text-white/80 text-center mt-2">
            Consulta qué ejercicios has realizado y cuántas repeticiones.
          </p>
        </motion.div>

        <motion.div
          ref={(el) => {
            if (el && !cardsRef.current.includes(el)) {
              cardsRef.current.push(el);
            }
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl flex flex-col items-center"
        >
          <FiCalendar className="text-5xl mb-3" />
          <h3 className="text-xl font-bold">Calendario Visual</h3>
          <p className="text-sm text-white/80 text-center mt-2">
            Visualiza tus días activos con un calendario interactivo.
          </p>
        </motion.div>

        <motion.div
          ref={(el) => {
            if (el && !cardsRef.current.includes(el)) {
              cardsRef.current.push(el);
            }
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl flex flex-col items-center"
        >
          <FiTrendingUp className="text-5xl mb-3" />
          <h3 className="text-xl font-bold">Estadísticas</h3>
          <p className="text-sm text-white/80 text-center mt-2">
            Consulta tu progreso semanal y mensual con métricas precisas.
          </p>
        </motion.div>
      </section>

      {/* Video Demo */}
      <section
        ref={videoRef}
        className="px-6 py-20 flex flex-col items-center justify-center"
      >
        <h2 className="text-3xl font-bold mb-6">🎥 Demo de la Aplicación</h2>
        <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 w-full max-w-4xl aspect-video">
          <video
            className="w-full h-full object-cover"
            controls
            autoPlay
            loop
            muted
          >
            <source src="/demo.mp4" type="video/mp4" />
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-20 px-6 bg-gradient-to-t from-black/40 to-transparent">
        <h2 className="text-3xl font-bold mb-4">
          ¿Listo para mejorar tu rendimiento?
        </h2>
        <p className="text-white/80 max-w-lg mx-auto mb-6">
          Únete a miles de usuarios que ya están controlando sus entrenamientos
          con ExerciseTracker.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              href="/api/auth/signin?csrf=true"
              className="bg-yellow-400 text-gray-900 font-semibold px-8 py-4 rounded-full shadow-lg hover:bg-yellow-300 transition cursor-pointer"
            >
              Registrarme Gratis
            </Link>
          </motion.div>

          <motion.a
            whileHover={{ scale: 1.05 }}
            className="relative px-8 py-4 rounded-full font-semibold shadow-lg bg-pink-500 hover:bg-pink-400 text-white overflow-hidden"
            href="https://buymeacoffee.com/johnfredy2000"
            target="_blank"
            rel="noopener noreferrer"
          >
            ☕ Invítame un café
            <span className="absolute inset-0 rounded-full border-2 border-white/50 animate-pulseGlow"></span>
          </motion.a>
        </div>
      </section>
    </div>
  );
}
