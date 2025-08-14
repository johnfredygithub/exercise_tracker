"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDetector,
  SupportedModels,
  PoseDetector,
  Pose,
} from "@tensorflow-models/pose-detection";
import { initBackend } from "../../lib/tf";
import { useExerciseTracker } from "../../hook/useExerciseTracker";

export default function JumpingJackDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<PoseDetector | null>(null);
  const [jumpCount, setJumpCount] = useState(0);
  const [angleLeftArm, setAngleLeftArm] = useState(0);
  const [angleRightArm, setAngleRightArm] = useState(0);
  const isOpenRef = useRef(false);

  const { handleSave } = useExerciseTracker();

  useEffect(() => {
    if (jumpCount > 0) {
      handleSave({
        repetitions: 1,
        exerciseName: "Jumping Jacks",
        notes: "notademo",
      });
    }
  }, [jumpCount]);

  useEffect(() => {
    let stream: MediaStream;
    let stop = false;

    async function setup() {
      await initBackend();
      const det = await createDetector(SupportedModels.MoveNet, {
        modelType: "SinglePose.Lightning",
      });
      setDetector(det);

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      video.srcObject = stream;

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        video.play();
        detectLoop(det);
      };
    }

    async function detectLoop(det: PoseDetector) {
      if (!canvasRef.current || !videoRef.current || stop) return;

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      const poses = await det.estimatePoses(videoRef.current);
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      poses.forEach((pose: Pose) => {
        detectJumpingJack(pose, ctx);

        pose.keypoints.forEach(({ x, y, score }) => {
          if ((score ?? 0) > 0.5) {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
          }
        });
      });

      requestAnimationFrame(() => detectLoop(det));
    }

    setup();

    return () => {
      stop = true;
      if (videoRef.current) videoRef.current.srcObject = null;
      stream?.getTracks().forEach((t) => t.stop());
      detector?.dispose();
    };
  }, []);

  function getAngle(A: any, B: any, C: any): number {
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const CB = { x: B.x - C.x, y: B.y - C.y };
    const dot = AB.x * CB.x + AB.y * CB.y;
    const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
    const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);
    const angle = Math.acos(dot / (magAB * magCB));
    return (angle * 180) / Math.PI;
  }

  function detectJumpingJack(pose: Pose, ctx: CanvasRenderingContext2D) {
    // 🔹 Obtiene puntos clave del brazo izquierdo
    const leftShoulder = pose.keypoints.find((k) => k.name === "left_shoulder");
    const leftElbow = pose.keypoints.find((k) => k.name === "left_elbow");
    const leftWrist = pose.keypoints.find((k) => k.name === "left_wrist");

    // 🔹 Obtiene puntos clave del brazo derecho
    const rightShoulder = pose.keypoints.find(
      (k) => k.name === "right_shoulder"
    );
    const rightElbow = pose.keypoints.find((k) => k.name === "right_elbow");
    const rightWrist = pose.keypoints.find((k) => k.name === "right_wrist");

    // 🔹 Obtiene puntos clave de los tobillos (pierna izquierda y derecha)
    const leftAnkle = pose.keypoints.find((k) => k.name === "left_ankle");
    const rightAnkle = pose.keypoints.find((k) => k.name === "right_ankle");

    // ✅ Verifica que todos los puntos existen y tienen buena confianza (> 0.5)
    if (
      leftShoulder &&
      leftElbow &&
      leftWrist &&
      rightShoulder &&
      rightElbow &&
      rightWrist &&
      leftAnkle &&
      rightAnkle &&
      leftShoulder.score! > 0.4 &&
      leftElbow.score! > 0.5 &&
      leftWrist.score! > 0.3 &&
      rightShoulder.score! > 0.4 &&
      rightElbow.score! > 0.5 &&
      rightWrist.score! > 0.3 &&
      leftAnkle.score! > 0.3 &&
      rightAnkle.score! > 0.3
    ) {
      // 📐 Calcula el ángulo del brazo izquierdo y derecho
      const angleLeft = getAngle(leftShoulder, leftElbow, leftWrist);
      const angleRight = getAngle(rightShoulder, rightElbow, rightWrist);

      // 💾 Guarda los ángulos (redondeados) en el estado
      setAngleLeftArm(Math.round(angleLeft));
      setAngleRightArm(Math.round(angleRight));

      // 🎨 Dibuja el brazo izquierdo en azul
      ctx.beginPath();
      ctx.moveTo(leftShoulder.x, leftShoulder.y);
      ctx.lineTo(leftElbow.x, leftElbow.y);
      ctx.lineTo(leftWrist.x, leftWrist.y);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 4;
      ctx.stroke();

      // 🎨 Dibuja el brazo derecho en naranja
      ctx.beginPath();
      ctx.moveTo(rightShoulder.x, rightShoulder.y);
      ctx.lineTo(rightElbow.x, rightElbow.y);
      ctx.lineTo(rightWrist.x, rightWrist.y);
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 4;
      ctx.stroke();

      // 🏃‍♂️ Lógica para detectar Jumping Jack:

      // 1️⃣ Calcula la distancia horizontal entre los tobillos (pies separados o juntos)
      const feetDistance = Math.abs(leftAnkle.x - rightAnkle.x);
      console.log(`Distancia entre tobillos: ${feetDistance}`);

      // 2️⃣ Verifica si las manos están levantadas por encima de los hombros
      const handsUp =
        leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
      console.log(`Manos arriba: ${handsUp}`);
      // 📌 Estado "abierto": manos arriba y pies separados
      console.log(
        `Estado actual: ${isOpenRef.current ? "abierto" : "cerrado"}`
      );
      if (handsUp && feetDistance > 116 && !isOpenRef.current) {
        console.log("Manos arriba y pies separados, estado abierto");
        // ✅ Cambia el estado a "abierto"

        isOpenRef.current = true;
      }

      // 📌 Estado "cerrado": manos abajo y pies juntos
      if (!handsUp && feetDistance < 48 && isOpenRef.current) {
        isOpenRef.current = false;

        // ✅ Contador de Jumping Jacks
        setJumpCount((prev) => prev + 1);
        console.log("🕺 Jumping Jack detectado");
      }
    }
  }

  return (
    <div className="relative w-full max-w-full sm:max-w-3xl md:max-w-5xl mx-auto h-[70vh] sm:h-[80vh] md:h-[90vh] bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Contador */}
      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-black px-4 py-2 rounded-md shadow-md z-30 text-base font-semibold space-y-1">
        <div>🕺 Jumping Jacks: {jumpCount}</div>
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
