"use client";
import { getExerciseMetrics } from "@/actions/getExerciseMetrics";
import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaPencilAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { updateNoteTracking } from "@/actions/updateNote";

type ExerciseRecord = {
  id: string;
  date: string;
  exercises: string[];
  count: number;
  notes: string;
};

const MetricasXExercise = () => {
  const [data, setData] = useState<ExerciseRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExerciseRecord | null>(
    null,
  );
  const [noteValue, setNoteValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysRange, setDaysRange] = useState(7);
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState({
    totalReps: 0,
    totalDays: 0,
    rangeLabel: "Todos los registros",
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async (startDateParam?: string, endDateParam?: string) => {
    setIsFiltering(true);
    try {
      const res = await getExerciseMetrics({
        startDate: startDateParam,
        endDate: endDateParam,
      });
      setData(res);
      const totalReps = res.reduce((acc, record) => acc + record.count, 0);
      const rangeLabel =
        startDateParam || endDateParam
          ? `${startDateParam || "Inicio"} → ${endDateParam || "Fin"}`
          : "Todos los registros";
      setSummary({ totalReps, totalDays: res.length, rangeLabel });
    } finally {
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (record: ExerciseRecord) => {
    setSelectedRecord(record);
    setNoteValue(record.notes);
    setModalOpen(true);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleSave = () => {
    if (!selectedRecord) return;
    const updatedData = data.map((item) =>
      item.id === selectedRecord.id ? { ...item, notes: noteValue } : item,
    );
    setData(updatedData);
    updateNoteTracking({ id: selectedRecord.id, notes: noteValue });
    setModalOpen(false);
  };

  const handleFilter = async () => {
    await fetchData(startDate, endDate);
  };

  const handleReset = async () => {
    setStartDate("");
    setEndDate("");
    setDaysRange(7);
    await fetchData();
  };

  const handleDaysRangeChange = async (value: number) => {
    setDaysRange(value);
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const startDateValue = new Date(today);
    startDateValue.setDate(startDateValue.getDate() - (value - 1));
    const start = startDateValue.toISOString().split("T")[0];
    setStartDate(start);
    setEndDate(end);
    await fetchData(start, end);
  };

  const tabs = ["Vista General", "Por Ejercicio", "Tendencias"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        .metricas-root {
          --em: #00ff87;
          --em2: #00c6ff;
          --bg: linear-gradient(135deg, #0a0a0f 0%, #0f0f14 50%, #0a0a0f 100%);
          --surface: #252534;
          --surface2: #044a5f;
          --border: rgba(255,255,255,0.07);
          --text: #e8e8f0;
          --muted: rgba(232,232,240,0.45);
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          padding: 2rem 1rem;
        }

        .metricas-root * { box-sizing: border-box; }

        .back-button {
          position: absolute;
          top: 0;
          left: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1rem;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(0,0,0,0.45);
          color: #e8e8f0;
          font-size: 0.95rem;
          cursor: pointer;
          backdrop-filter: blur(10px);
          box-shadow: 0 16px 30px rgba(0,0,0,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .back-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 20px 36px rgba(0,0,0,0.32);
          background: rgba(0,0,0,0.6);
        }

        .heading-display {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.05em;
          line-height: 1;
        }

        /* Glowing underline accent */
        .accent-line {
          height: 3px;
          width: 60px;
          background: linear-gradient(90deg, var(--em), var(--em2));
          border-radius: 99px;
          box-shadow: 0 0 12px var(--em);
        }

        /* Tab pills */
        .tab-group {
          display: flex;
          gap: 6px;
          background: var(--surface2);
          border-radius: 14px;
          padding: 5px;
          border: 1px solid var(--border);
        }
        .tab-pill {
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--muted);
          background: transparent;
          border: none;
          letter-spacing: 0.02em;
        }
        .tab-pill.active {
          background: linear-gradient(135deg, var(--em) 0%, #00e0a0 100%);
          color: #0a0a0f;
          font-weight: 600;
          box-shadow: 0 0 18px rgba(0,255,135,0.35);
        }

        /* Stat cards */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
        }
        @media (max-width: 600px) {
          .stat-grid { grid-template-columns: 1fr; }
        }
        .stat-card {
          background: var(--surface);
          padding: 1.75rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .stat-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.8rem;
          line-height: 1;
          color: var(--text);
        }
        .stat-value.em { color: var(--em); text-shadow: 0 0 20px rgba(0,255,135,0.4); }
        .stat-value.em2 { color: var(--em2); text-shadow: 0 0 20px rgba(0,198,255,0.4); }
        .stat-sub {
          font-size: 12px;
          color: var(--muted);
        }

        /* Filter card */
        .filter-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.75rem;
        }
        .input-field {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          padding: 10px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .input-field:focus {
          border-color: var(--em);
          box-shadow: 0 0 0 3px rgba(0,255,135,0.12);
        }
        .input-field::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
        .field-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          display: block;
          margin-bottom: 6px;
        }

        /* Slider */
        input[type="range"].em-range {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 99px;
          background: var(--surface2);
          outline: none;
          cursor: pointer;
        }
        input[type="range"].em-range::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--em), var(--em2));
        }
        input[type="range"].em-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--em);
          box-shadow: 0 0 10px rgba(0,255,135,0.6);
          margin-top: -7px;
        }

        /* Buttons */
        .btn-em {
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.04em;
          border: none;
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-em.primary {
          background: linear-gradient(135deg, var(--em), #00e0a0);
          color: #0a0a0f;
          box-shadow: 0 0 20px rgba(0,255,135,0.3);
        }
        .btn-em.primary:hover { box-shadow: 0 0 28px rgba(0,255,135,0.5); transform: translateY(-1px); }
        .btn-em.ghost {
          background: var(--surface2);
          color: var(--text);
          border: 1px solid var(--border);
        }
        .btn-em.ghost:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
        .btn-em.outline {
          background: transparent;
          color: var(--em);
          border: 1px solid rgba(0,255,135,0.3);
        }
        .btn-em.outline:hover { background: rgba(0,255,135,0.08); border-color: var(--em); }
        .btn-em.danger {
          background: linear-gradient(135deg, #ff4757, #ff3838);
          color: #ffffff;
          box-shadow: 0 0 20px rgba(255,71,87,0.3);
        }
        .btn-em.danger:hover { box-shadow: 0 0 28px rgba(255,71,87,0.5); transform: translateY(-1px); }
        .btn-em:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

        /* Badge */
        .badge-em {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: rgba(0,255,135,0.12);
          color: var(--em);
          border: 1px solid rgba(0,255,135,0.25);
        }

        /* Table */
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }
        .data-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background 0.15s;
        }
        .data-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .data-table tbody td {
          padding: 14px 16px;
          font-size: 14px;
          color: var(--text);
          vertical-align: middle;
        }
        .data-table tbody tr:last-child { border-bottom: none; }

        /* Exercise badge */
        .ex-badge {
          display: inline-flex;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          background: rgba(0,198,255,0.1);
          color: var(--em2);
          border: 1px solid rgba(0,198,255,0.2);
          margin: 2px;
        }

        /* Modal backdrop */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(10,10,15,0.9) 100%);
          backdrop-filter: blur(12px);
          z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .modal-box {
          background: linear-gradient(135deg, var(--surface) 0%, rgba(17,17,24,0.95) 100%);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem;
          width: 100%;
          max-width: 440px;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(0,255,135,0.1);
        }
        .modal-box::before {
          content: '';
          position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 80px; height: 2px;
          background: linear-gradient(90deg, var(--em), var(--em2));
          border-radius: 0 0 4px 4px;
        }
        .modal-textarea {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text);
          padding: 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          min-height: 110px;
          resize: none;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .modal-textarea:focus {
          border-color: var(--em);
          box-shadow: 0 0 0 3px rgb(248, 255, 252);
        }

        /* Divider */
        .divider { height: 1px; background: var(--border); margin: 0; }

        /* Empty state */
        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: var(--muted);
        }
        .empty-icon {
          width: 56px; height: 56px;
          background: var(--surface2);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          font-size: 24px;
        }

        /* Spinner */
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0a0a0f;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .rep-count { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; color: var(--em); }
        .date-cell { font-variant-numeric: tabular-nums; color: var(--muted); font-size: 13px; }
      `}</style>

      <div className="metricas-root">
        <motion.div
          style={{ maxWidth: 900, margin: "0 auto" }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ── Header ── */}
          <div style={{ margin: "2.5rem", position: "-webkit-sticky" }}>
            <motion.p
              className="heading-display"
              style={{
                fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
                marginBottom: 6,
                color: "var(--text)",
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              MÉTRICAS
            </motion.p>
            <motion.p
              className="heading-display"
              style={{
                fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
                color: "var(--em)",
                textShadow: "0 0 30px rgba(0,255,135,0.4)",
                marginBottom: 14,
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 }}
            >
              DE EJERCICIOS
            </motion.p>
            <motion.div
              className="accent-line"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 }}
              style={{ transformOrigin: "left" }}
            />
          </div>

          {/* ── Tabs ── */}
          <motion.div
            className="tab-group"
            style={{ marginBottom: "2rem", display: "inline-flex" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {tabs.map((tab, i) => (
              <button
                key={tab}
                className={`tab-pill${activeTab === i ? " active" : ""}`}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </motion.div>

          {/* ── Stat Cards ── */}
          <motion.div
            className="stat-grid"
            style={{ marginBottom: "1.5rem" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            key={summary.rangeLabel}
          >
            <div className="stat-card">
              <span className="stat-label">Rango</span>
              <span
                className="stat-value"
                style={{
                  fontSize: "1.1rem",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  paddingTop: 6,
                }}
              >
                {summary.rangeLabel}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Reps</span>
              <span className="stat-value em">
                {summary.totalReps.toLocaleString()}
              </span>
              <span className="stat-sub">repeticiones acumuladas</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Días</span>
              <span className="stat-value em2">{summary.totalDays}</span>
              <span className="stat-sub">días registrados</span>
            </div>
          </motion.div>

          {/* ── Filter Card ── */}
          <motion.div
            className="filter-card"
            style={{ marginBottom: "1.5rem" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.25rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                  Filtros de Fecha
                </p>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>
                  Usa el slider para un rango rápido o ajusta las fechas
                  manualmente
                </p>
              </div>
              <AnimatePresence>
                {(startDate || endDate) && (
                  <motion.div
                    className="badge-em"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <span>●</span> Filtro activo
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <label className="field-label">Desde</label>
                <input
                  type="date"
                  className="input-field"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Hasta</label>
                <input
                  type="date"
                  className="input-field"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="field-label"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Rango rápido</span>
                  <span style={{ color: "var(--em)", fontSize: 11 }}>
                    {daysRange} días
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={daysRange}
                  className="em-range"
                  style={{ marginTop: 8 }}
                  onChange={async (e) =>
                    await handleDaysRangeChange(Number(e.target.value))
                  }
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--muted)",
                    marginTop: 4,
                  }}
                >
                  <span>1</span>
                  <span>30 días</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
              <motion.button
                className="btn-em primary"
                onClick={handleFilter}
                disabled={isFiltering}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isFiltering ? (
                  <>
                    <div className="spinner" /> Filtrando
                  </>
                ) : (
                  <>✓ Aplicar filtro</>
                )}
              </motion.button>
              <motion.button
                className="btn-em ghost"
                onClick={handleReset}
                disabled={isFiltering}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                ↺ Limpiar
              </motion.button>
              <motion.button
                className="btn-em outline"
                onClick={() => console.log("Exportar")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                ↗ Exportar
              </motion.button>
            </div>
          </motion.div>

          {/* ── Table ── */}
          <motion.div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              overflow: "hidden",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ fontWeight: 600, fontSize: 14 }}>
                Historial de Registros
              </p>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {data.length} entradas
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ejercicio</th>
                    <th>Reps</th>
                    <th>Notas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {data.length > 0 ? (
                      data.map((record, idx) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ delay: idx * 0.04, duration: 0.3 }}
                        >
                          <td className="date-cell">{record.date}</td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 2,
                              }}
                            >
                              {record.exercises.map((ex, i) => (
                                <span key={i} className="ex-badge">
                                  {ex}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className="rep-count">{record.count}</span>
                          </td>
                          <td
                            style={{
                              fontSize: 13,
                              color: "var(--muted)",
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {record.notes || (
                              <span style={{ opacity: 0.4 }}>Sin notas</span>
                            )}
                          </td>
                          <td>
                            <motion.button
                              className="btn-em ghost"
                              style={{ padding: "6px 14px", fontSize: 12 }}
                              onClick={() => handleOpenModal(record)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaPencilAlt size={11} /> Editar
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>
                              Sin datos para mostrar
                            </p>
                            <p style={{ fontSize: 13 }}>
                              Prueba ajustando los filtros de fecha
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.6rem",
                  letterSpacing: "0.05em",
                  marginBottom: "0.25rem",
                  color: "var(--text)",
                }}
              >
                EDITAR NOTA
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: "1.25rem",
                }}
              >
                {selectedRecord?.date} · {selectedRecord?.exercises.join(", ")}
              </p>

              <textarea
                className="modal-textarea"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Escribe una nota sobre esta sesión..."
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.625rem",
                  marginTop: "1.25rem",
                }}
              >
                <motion.button
                  className="btn-em danger"
                  onClick={() => setModalOpen(false)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  className="btn-em danger"
                  onClick={handleSave}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Guardar nota
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MetricasXExercise;
