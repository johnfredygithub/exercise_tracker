"use client";
import { getExerciseMetrics } from "@/actions/getExerciseMetrics";
import React, { useEffect, useRef, useState } from "react";
import { FaPencilAlt } from "react-icons/fa";
import gsap from "gsap";
import { addOrUpdateTracking } from "@/actions/RegisterTracking";
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
    null
  );
  const [noteValue, setNoteValue] = useState("");
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getExerciseMetrics();
      setData(res);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (tableRef.current) {
      gsap.fromTo(
        tableRef.current.querySelectorAll("tr"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [data]);

  const handleOpenModal = (record: ExerciseRecord) => {
    setSelectedRecord(record);
    setNoteValue(record.notes);
    (document.getElementById("editModal") as HTMLDialogElement).showModal();
  };

  const handleSave = () => {
    if (!selectedRecord) return;

    // ✅ actualiza localmente la nota
    const updatedData = data.map((item) =>
      item.exercises === selectedRecord.exercises &&
      item.date === selectedRecord.date
        ? { ...item, notes: noteValue }
        : item
    );
    setData(updatedData);
    updateNoteTracking({ id: selectedRecord.id, notes: noteValue });
    // ✅ cierra el modal
    (document.getElementById("editModal") as HTMLDialogElement).close();
  };

  return (
    <div className="overflow-x-auto p-4 justify-center">
      <h2 className="text-xl font-bold mb-4 text-center">
        📊 Métricas de Ejercicios
      </h2>
      <table className="table w-full rounded-2xl shadow-xl bg-base-100">
        <thead className="bg-base-200">
          <tr className="text-center">
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Ejercicio</th>
            <th className="px-4 py-3">Repeticiones</th>
            <th className="px-4 py-3">Notas</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody ref={tableRef}>
          {data.map((record, idx) => (
            <tr
              key={idx}
              className="hover:bg-base-200 transition-colors text-center"
            >
              <td className="px-4 py-2">{record.date}</td>
              <td className="px-4 py-2 font-medium">{record.exercises}</td>
              <td className="px-4 py-2">{record.count}</td>
              <td className="px-4 py-2 italic">{record.notes}</td>
              <td className="px-4 py-2">
                <button
                  className="btn btn-outline btn-sm rounded-xl flex items-center gap-1"
                  onClick={() => handleOpenModal(record)}
                >
                  <FaPencilAlt size={16} /> Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔹 Modal DaisyUI */}
      <dialog id="editModal" className="modal">
        <div
          className="modal-box fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                  rounded-2xl shadow-2xl bg-amber-200 p-6 animate-fadeIn w-[90%] max-w-md"
        >
          <h3 className="font-bold text-xl mb-4 text-center text-primary">
            ✏️ Editar Nota
          </h3>

          <textarea
            className="textarea textarea-bordered w-full min-h-[100px] rounded-xl 
                 focus:outline-none focus:ring-2 focus:ring-primary"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
          ></textarea>

          <div className="modal-action flex justify-end gap-3 mt-4">
            <button
              className="btn btn-ghost rounded-xl"
              onClick={() =>
                (
                  document.getElementById("editModal") as HTMLDialogElement
                ).close()
              }
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary rounded-xl px-6"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        </div>

        {/* Fondo difuminado */}
        <form
          method="dialog"
          className="modal-backdrop bg-amber-100/40 backdrop-blur-sm"
        ></form>
      </dialog>
    </div>
  );
};

export default MetricasXExercise;
