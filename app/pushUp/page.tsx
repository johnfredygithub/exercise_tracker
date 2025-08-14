"use client"; // Indica que este componente se ejecuta en el cliente (Next.js 13+ con App Router)

import { useEffect, useRef, useState } from "react";
import {
  createDetector, // Función para crear un detector de poses
  SupportedModels, // Enum con modelos soportados (ej. MoveNet)
  PoseDetector, // Tipo de detector
  Pose, // Tipo que representa una pose detectada
} from "@tensorflow-models/pose-detection";
import { initBackend } from "../../lib/tf"; // Inicializa el backend de TensorFlow.js
import { useExerciseTracker } from "../../hook/useExerciseTracker";

export default function Page() {
  // Referencias al <video> y <canvas>
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estado para guardar el detector de poses
  const [detector, setDetector] = useState<PoseDetector | null>(null);

  // Estado para mostrar el ángulo del codo
  const [angle, setAngle] = useState(0);

  // Referencia para saber si estamos en fase de bajada de flexión
  const isPushDownRef = useRef(false);
  const [pushupCount, setPushupCount] = useState(0); // Contador de flexiones

  const { handleSave } = useExerciseTracker();

  useEffect(() => {
    if (pushupCount > 0) {
      handleSave({
        repetitions: 1,
        exerciseName: "PUSH UP",
        notes: "PUSH UP",
      });
    }
  }, [pushupCount]);

  useEffect(() => {
    let stream: MediaStream; // Flujo de la cámara
    let stop = false; // Flag para detener la detección cuando el componente se desmonte

    async function setup() {
      await initBackend(); // Inicializa TensorFlow.js en el navegador

      // Crea el detector usando MoveNet en modo "SinglePose.Lightning" (rápido, pero menos preciso)
      const det = await createDetector(SupportedModels.MoveNet, {
        modelType: "SinglePose.Lightning",
      });
      setDetector(det);

      // Accede a la cámara del usuario
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      // Asigna el flujo de la cámara al <video>
      video.srcObject = stream;

      // Cuando el video tenga dimensiones reales
      video.onloadedmetadata = () => {
        // Ajusta el canvas para que coincida con el tamaño del video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        video.play(); // Empieza la reproducción del video
        detectLoop(det); // Inicia la detección de poses en bucle
      };
    }

    async function detectLoop(det: PoseDetector) {
      if (!canvasRef.current || !videoRef.current || stop) return;

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      // Detecta poses en el frame actual del video
      const poses = await det.estimatePoses(videoRef.current);

      // Limpia el canvas antes de dibujar
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Procesa cada pose detectada
      poses.forEach((pose: Pose) => {
        detectPushUp(pose, ctx); // Detecta si hay flexiones

        // Dibuja puntos rojos en las articulaciones con confianza > 0.5
        pose.keypoints.forEach(({ x, y, score }) => {
          if ((score ?? 0) > 0.5) {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
          }
        });
      });

      // Llama a la función otra vez en el siguiente frame
      requestAnimationFrame(() => detectLoop(det));
    }

    setup(); // Inicia la configuración

    // Limpieza al desmontar el componente
    return () => {
      stop = true;
      if (videoRef.current) videoRef.current.srcObject = null;
      stream?.getTracks().forEach((t) => t.stop()); // Detiene la cámara
      detector?.dispose(); // Libera recursos del detector
    };
  }, []);

  // Calcula el ángulo entre tres puntos (A-B-C) en grados
  function getAngle(
    A: { x: number; y: number },
    B: { x: number; y: number },
    C: { x: number; y: number }
  ): number {
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const CB = { x: B.x - C.x, y: B.y - C.y };
    const dot = AB.x * CB.x + AB.y * CB.y; // Producto punto
    const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
    const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);
    const angle = Math.acos(dot / (magAB * magCB));
    return (angle * 180) / Math.PI; // Convierte a grados
  }

  // Detecta una flexión usando la pose detectada
  function detectPushUp(pose: Pose, ctx: CanvasRenderingContext2D) {
    // Busca las articulaciones necesarias
    const leftShoulder = pose.keypoints.find((k) => k.name === "left_shoulder");
    const leftElbow = pose.keypoints.find((k) => k.name === "left_elbow");
    const leftWrist = pose.keypoints.find((k) => k.name === "left_wrist");
    const head = pose.keypoints.find((k) => k.name === "nose");
    const leftHip = pose.keypoints.find((k) => k.name === "left_hip");

    // Si falta alguna articulación o la confianza es baja, no seguimos
    if (
      !leftShoulder ||
      !leftElbow ||
      !leftWrist ||
      !head ||
      !leftHip ||
      leftShoulder.score! < 0.3 ||
      leftElbow.score! < 0.3 ||
      leftWrist.score! < 0.3 ||
      head.score! < 0.4 ||
      leftHip.score! < 0.3
    )
      return;

    // Verifica que el cuerpo esté horizontal (evita falsos positivos de pie)
    const verticalDistance = Math.abs(head.y - leftHip.y);
    if (verticalDistance > 100) return;

    // Calcula el ángulo del codo
    const elbowAngle = getAngle(leftShoulder, leftElbow, leftWrist);
    setAngle(elbowAngle); // Guarda el ángulo para mostrarlo en pantalla

    // Cambia el color y detecta fases de la flexión
    let color = "gray";
    if (elbowAngle < 90 && !isPushDownRef.current) {
      isPushDownRef.current = true; // Está bajando
      color = "red";
    }

    if (elbowAngle > 150 && isPushDownRef.current) {
      isPushDownRef.current = false; // Está subiendo
      setPushupCount((prev) => prev + 1); // Cuenta la flexión
      color = "green";
      console.log("✅ Flexión detectada");
    }

    // Dibuja una línea entre hombro-codo-muñeca
    ctx.beginPath();
    ctx.moveTo(leftShoulder.x, leftShoulder.y);
    ctx.lineTo(leftElbow.x, leftElbow.y);
    ctx.lineTo(leftWrist.x, leftWrist.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  return (
    <div className="relative w-full max-w-full sm:max-w-3xl md:max-w-5xl mx-auto h-[70vh] sm:h-[80vh] md:h-[90vh] bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Contador */}
      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-black px-4 py-2 rounded-md shadow-md z-30 text-base font-semibold space-y-1">
        <div>💪 Flexiones: {pushupCount}</div>
      </div>
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover z-10"
        autoPlay
        muted
      />
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none"
      />
    </div>
  );
}
