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

export default function Biceps() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [detector, setDetector] = useState<PoseDetector | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [avgAngle, setAvgAngle] = useState(0);

  const isDownRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const angleHistoryRef = useRef<number[]>([]);
  console.log(avgAngle);

  const { handleSave } = useExerciseTracker();

  useEffect(() => {
    if (repCount > 0) {
      handleSave({
        repetitions: 1,
        exerciseName: "BICEPS",
        notes: "BICEPS",
      });
    }
  }, [repCount]);

  useEffect(() => {
    let stream: MediaStream;
    let stop = false;

    async function setup() {
      console.log("Inicializando backend TensorFlow...");
      await initBackend();

      console.log("Cargando modelo MoveNet...");
      const det = await createDetector(SupportedModels.MoveNet, {
        modelType: "SinglePose.Lightning",
      });
      setDetector(det);

      console.log("Solicitando acceso a la cámara...");
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      video.srcObject = stream;

      video.onloadedmetadata = () => {
        console.log("Cámara lista:", video.videoWidth, "x", video.videoHeight);
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

      if (poses.length === 0) {
        console.warn("⚠ No se detectaron poses.");
      }

      poses.forEach((pose, idx) => {
        console.log(
          `Pose #${idx + 1}`,
          pose.keypoints.map((k) => `${k.name}:${k.score?.toFixed(2)}`)
        );
        detectBenchDip(pose, ctx);

        pose.keypoints.forEach(({ x, y, score }) => {
          if ((score ?? 0) > 0.7) {
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

  function getAngle(A: any, B: any, C: any) {
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const CB = { x: B.x - C.x, y: B.y - C.y };
    const dot = AB.x * CB.x + AB.y * CB.y;
    const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
    const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);
    const angle = Math.acos(dot / (magAB * magCB));
    return (angle * 180) / Math.PI;
  }

  function detectBenchDip(pose: Pose, ctx: CanvasRenderingContext2D) {
    const minScore = 0.4;

    // Localizamos puntos clave
    const leftShoulder = pose.keypoints.find((k) => k.name === "left_shoulder");
    const leftElbow = pose.keypoints.find((k) => k.name === "left_elbow");
    const leftWrist = pose.keypoints.find((k) => k.name === "left_wrist");

    const rightShoulder = pose.keypoints.find(
      (k) => k.name === "right_shoulder"
    );
    const rightElbow = pose.keypoints.find((k) => k.name === "right_elbow");
    const rightWrist = pose.keypoints.find((k) => k.name === "right_wrist");

    const isLeftValid =
      leftShoulder?.score! > minScore &&
      leftElbow?.score! > minScore &&
      leftWrist?.score! > minScore;

    const isRightValid =
      rightShoulder?.score! > minScore &&
      rightElbow?.score! > minScore &&
      rightWrist?.score! > minScore;

    console.log("LeftValid:", isLeftValid, "RightValid:", isRightValid);

    if (!isLeftValid && !isRightValid) {
      console.warn("❌ No se detectaron brazos con suficiente confianza.");
      return;
    }

    let angles: number[] = [];

    if (isLeftValid) {
      const angleLeft = getAngle(leftShoulder, leftElbow, leftWrist);
      console.log(`Ángulo brazo izquierdo: ${angleLeft.toFixed(2)}°`);
      angles.push(angleLeft);
      drawLimb(ctx, leftShoulder, leftElbow, leftWrist, "blue");
    }

    if (isRightValid) {
      const angleRight = getAngle(rightShoulder, rightElbow, rightWrist);
      console.log(`Ángulo brazo derecho: ${angleRight.toFixed(2)}°`);
      angles.push(angleRight);
      drawLimb(ctx, rightShoulder, rightElbow, rightWrist, "orange");
    }

    // Promediamos los ángulos
    let currentAngle = angles.reduce((a, b) => a + b, 0) / angles.length;

    // Suavizado
    angleHistoryRef.current.push(currentAngle);
    if (angleHistoryRef.current.length > 5) {
      angleHistoryRef.current.shift();
    }
    currentAngle =
      angleHistoryRef.current.reduce((a, b) => a + b, 0) /
      angleHistoryRef.current.length;

    setAvgAngle(Math.round(currentAngle));

    console.log(`Ángulo promedio suavizado: ${currentAngle.toFixed(2)}°`);

    const now = Date.now();
    const minTimeBetweenReps = 800;

    // Bajada
    if (currentAngle < 90 && !isDownRef.current) {
      console.log("⬇ Fase de bajada detectada.");
      isDownRef.current = true;
    }

    // Subida
    if (
      currentAngle > 160 &&
      isDownRef.current &&
      now - lastRepTimeRef.current > minTimeBetweenReps
    ) {
      console.log("⬆ Fase de subida detectada. Contando repetición.");
      isDownRef.current = false;
      lastRepTimeRef.current = now;
      setRepCount((prev) => prev + 1);
    }
  }

  function drawLimb(
    ctx: CanvasRenderingContext2D,
    A: any,
    B: any,
    C: any,
    color: string
  ) {
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  return (
    <div className="relative w-full max-w-full sm:max-w-3xl md:max-w-5xl mx-auto h-[70vh] sm:h-[80vh] md:h-[90vh] bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Contador */}
      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-black px-4 py-2 rounded-md shadow-md z-30 text-base font-semibold space-y-1">
        <div>💪 Fondos: {repCount}</div>
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
