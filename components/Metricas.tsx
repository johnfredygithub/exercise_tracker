"use client";

import React, { useEffect, useRef, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import {
  getActiveDaysMetrics,
  getComparisonMetrics,
  getExerciseMetrics,
  getTotalsMetrics,
} from "../actions/getExerciseMetrics";
import { motion } from "framer-motion";
import gsap from "gsap";
import { SiVictoriametrics } from "react-icons/si";

// Iconos
import { FiActivity, FiTrendingUp, FiCalendar, FiRepeat } from "react-icons/fi";
import Link from "next/link";

export default function Metricas() {
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsCalendar, setMetricsCalendar] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const iconsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    getExerciseMetrics().then(setMetricsCalendar);
  }, []);

  useEffect(() => {
    (async () => {
      const totals = await getTotalsMetrics();
      const activeDays = await getActiveDaysMetrics();
      const comparison = await getComparisonMetrics();
      setMetrics({ totals, activeDays, comparison });
    })();
  }, []);

  // Animaciones GSAP
  useEffect(() => {
    if (!metrics) return;
    const ctx = gsap.context(() => {
      gsap.to(containerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [metrics]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Cargando métricas...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="p-6 max-w-5xl mx-auto mt-10 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-950"
    >
      <h1 className="text-3xl font-bold mb-6 text-white text-center drop-shadow-lg">
        📈 Progreso de Ejercicios
      </h1>

      {/* Heatmap */}
      <div className="overflow-x-auto p-4 bg-white/20 backdrop-blur-sm rounded-xl shadow-inner">
        <CalendarHeatmap
          startDate={new Date("2025-01-01")}
          endDate={new Date("2025-12-31")}
          values={metricsCalendar}
          classForValue={(value) => {
            if (!value || value.count === 0) return "color-empty";
            return `color-scale-${Math.min(value.count, 4)}`;
          }}
          tooltipDataAttrs={(value): Record<string, string> => {
            if (!value || !value.date) return {};
            if (value.count === 0) {
              return {
                "data-tooltip-id": "heatmap-tooltip",
                "data-tooltip-content": `${value.date} - Sin actividad`,
              };
            }
            return {
              "data-tooltip-id": "heatmap-tooltip",
              "data-tooltip-content": `${value.date} - Total: ${
                value.count
              } repeticiones\n${value.exercises.join(", ")}`,
            };
          }}
        />
      </div>
      <ReactTooltip
        id="heatmap-tooltip"
        className="!bg-gray-800 !text-white !p-2 !rounded-lg text-sm"
      />

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <motion.div
          ref={(el) => {
            if (el) cardsRef.current.push(el);
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-blue-500 text-white rounded-xl p-5 shadow-lg flex flex-col items-center"
        >
          <div
            ref={(el) => {
              if (el) cardsRef.current.push(el);
            }}
          >
            <FiActivity className="text-4xl mb-2" />
          </div>
          <h3 className="text-lg font-semibold">Total diario</h3>
          <p className="text-2xl font-bold">
            {metrics?.totals?.dailyTotal ?? 0}
          </p>
        </motion.div>

        <motion.div
          ref={(el) => {
            if (el) cardsRef.current.push(el);
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-green-500 text-white rounded-xl p-5 shadow-lg flex flex-col items-center"
        >
          <div
            ref={(el) => {
              if (el) cardsRef.current.push(el);
            }}
          >
            <FiRepeat className="text-4xl mb-2" />
          </div>
          <h3 className="text-lg font-semibold">Más repetido</h3>
          <p className="text-xl font-bold text-center">
            {metrics?.totals?.mostRepeatedMonth?.exerciseName ?? "N/A"}
          </p>
        </motion.div>

        <motion.div
          ref={(el) => {
            if (el) cardsRef.current.push(el);
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-yellow-500 text-gray-900 rounded-xl p-5 shadow-lg flex flex-col items-center"
        >
          <div
            ref={(el) => {
              if (el) cardsRef.current.push(el);
            }}
          >
            <FiCalendar className="text-4xl mb-2" />
          </div>
          <h3 className="text-lg font-semibold">Días activos</h3>
          <p className="text-2xl font-bold">
            {metrics?.activeDays?.activeDays ?? 0}
          </p>
        </motion.div>

        <motion.div
          ref={(el) => {
            if (el) cardsRef.current.push(el);
          }}
          whileHover={{ scale: 1.05 }}
          className="bg-purple-500 text-white rounded-xl p-5 shadow-lg flex flex-col items-center"
        >
          <div
            ref={(el) => {
              if (el) cardsRef.current.push(el);
            }}
          >
            <FiTrendingUp className="text-4xl mb-2" />
          </div>
          <h3 className="text-lg font-semibold">Cambio semanal</h3>
          <p className="text-2xl font-bold">
            {metrics?.comparison?.weekChange ?? 0}%
          </p>
        </motion.div>

        <Link href={"MetricasTable"}>
          <motion.div
            ref={(el) => {
              if (el) cardsRef.current.push(el);
            }}
            whileHover={{ scale: 1.05 }}
            className="bg-purple-500 text-white rounded-xl p-5 shadow-lg flex flex-col items-center"
          >
            <div
              ref={(el) => {
                if (el) cardsRef.current.push(el);
              }}
            >
              <SiVictoriametrics className="text-4xl mb-2" />
            </div>
            <p className="text-2xl font-bold">TABLA</p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
