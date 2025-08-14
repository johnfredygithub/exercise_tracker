"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDetector,
  SupportedModels,
  PoseDetector,
  Pose,
} from "@tensorflow-models/pose-detection";

import { initBackend } from "../lib/tf";

export default function PoseDetectorComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<PoseDetector | null>(null);
  const [squatCount, setSquatCount] = useState(0);
  const [angle, setAngle] = useState(0);
  const isDownRef = useRef(false);

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

      // Espera a que el video tenga dimensiones reales
      video.onloadedmetadata = () => {
        // Ajusta el tamaño del canvas al del video real
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
        detectSquat(pose, ctx);
        detectPushUp(pose, ctx);
        detectJumpingJack(pose, ctx);
        detectVerticalJump(pose);
        debugPoseValues(pose);

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

  function getAngle(
    A: { x: number; y: number },
    B: { x: number; y: number },
    C: { x: number; y: number }
  ): number {
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const CB = { x: B.x - C.x, y: B.y - C.y };
    const dot = AB.x * CB.x + AB.y * CB.y;
    const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
    const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);
    const angle = Math.acos(dot / (magAB * magCB));
    return (angle * 180) / Math.PI; // en grados
  }

  function detectSquat(pose: Pose, ctx: CanvasRenderingContext2D) {
    const leftHip = pose.keypoints.find((k) => k.name === "left_hip");
    const leftKnee = pose.keypoints.find((k) => k.name === "left_knee");
    const leftAnkle = pose.keypoints.find((k) => k.name === "left_ankle");

    const rightHip = pose.keypoints.find((k) => k.name === "right_hip");
    const rightKnee = pose.keypoints.find((k) => k.name === "right_knee");
    const rightAnkle = pose.keypoints.find((k) => k.name === "right_ankle");

    // Verifica que ambas piernas tengan puntos válidos
    const isLeftValid =
      leftHip &&
      leftKnee &&
      leftAnkle &&
      leftHip.score! > 0.5 &&
      leftKnee.score! > 0.5 &&
      leftAnkle.score! > 0.5;

    const isRightValid =
      rightHip &&
      rightKnee &&
      rightAnkle &&
      rightHip.score! > 0.5 &&
      rightKnee.score! > 0.5 &&
      rightAnkle.score! > 0.5;

    if (!isLeftValid && !isRightValid) return;

    let angles: number[] = [];

    if (isLeftValid) {
      const angleLeft = getAngle(leftHip, leftKnee, leftAnkle);
      angles.push(angleLeft);

      // Dibuja línea pierna izquierda
      ctx.beginPath();
      ctx.moveTo(leftHip.x, leftHip.y);
      ctx.lineTo(leftKnee.x, leftKnee.y);
      ctx.lineTo(leftAnkle.x, leftAnkle.y);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    if (isRightValid) {
      const angleRight = getAngle(rightHip, rightKnee, rightAnkle);
      angles.push(angleRight);

      // Dibuja línea pierna derecha
      ctx.beginPath();
      ctx.moveTo(rightHip.x, rightHip.y);
      ctx.lineTo(rightKnee.x, rightKnee.y);
      ctx.lineTo(rightAnkle.x, rightAnkle.y);
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    const avgAngle = angles.reduce((sum, a) => sum + a, 0) / angles.length;
    setAngle(Math.round(avgAngle));

    // Lógica de conteo
    if (avgAngle < 100 && !isDownRef.current) {
      isDownRef.current = true;
    }

    if (avgAngle > 160 && isDownRef.current) {
      isDownRef.current = false;
      setSquatCount((prev) => prev + 1);
      console.log("✅ Sentadilla detectada");
    }
  }

  ///////////////flexiones
  const isPushDownRef = useRef(false);
  const [pushupCount, setPushupCount] = useState(0);

  // Estados globales o refs en tu componente React

  function detectPushUp(pose: Pose, ctx: CanvasRenderingContext2D) {
    const leftShoulder = pose.keypoints.find((k) => k.name === "left_shoulder");
    const leftElbow = pose.keypoints.find((k) => k.name === "left_elbow");
    const leftWrist = pose.keypoints.find((k) => k.name === "left_wrist");
    const head = pose.keypoints.find((k) => k.name === "nose");
    const leftHip = pose.keypoints.find((k) => k.name === "left_hip");

    if (
      !leftShoulder ||
      !leftElbow ||
      !leftWrist ||
      !head ||
      !leftHip ||
      leftShoulder.score! < 0.5 ||
      leftElbow.score! < 0.5 ||
      leftWrist.score! < 0.5 ||
      head.score! < 0.5 ||
      leftHip.score! < 0.5
    )
      return;

    // Verificamos si está horizontal
    const verticalDistance = Math.abs(head.y - leftHip.y);
    if (verticalDistance > 100) return;

    const angle = getAngle(leftShoulder, leftElbow, leftWrist);

    // Cambiar color según fase
    let color = "gray";
    if (angle < 90 && !isPushDownRef.current) {
      isPushDownRef.current = true;
      color = "red"; // bajando
    }

    if (angle > 150 && isPushDownRef.current) {
      isPushDownRef.current = false;
      setPushupCount((prev) => prev + 1);
      color = "green"; // subiendo y contando
      console.log("✅ Flexión detectada");
    }

    // Dibujar líneas entre los puntos
    ctx.beginPath();
    ctx.moveTo(leftShoulder.x, leftShoulder.y);
    ctx.lineTo(leftElbow.x, leftElbow.y);
    ctx.lineTo(leftWrist.x, leftWrist.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ////////juping jack TODO:POR MEJORAR NO DETECTA BIEN
  const minFrames = 5; // frames necesarios para confirmar estado
  const framesClosedRef = useRef(0);
  const isJumpingJackRef = useRef(false); // True si estamos en la fase abierta
  const framesOpenRef = useRef(0); // Cuántos frames lleva en la posición abierta
  // Cuántos frames lleva en la posición cerrada
  const [jumpCount, setJumpCount] = useState(0); // Contador de jumping jacks

  function detectJumpingJack(pose: Pose, ctx?: CanvasRenderingContext2D) {
    const keypoints = Object.fromEntries(
      pose.keypoints.map((k) => [k.name, k])
    );

    const required = [
      "left_wrist",
      "right_wrist",
      "left_ankle",
      "right_ankle",
      "left_hip",
      "right_hip",
      "left_shoulder",
      "right_shoulder",
    ];

    if (
      required.some((name) => !keypoints[name] || keypoints[name].score! < 0.6)
    )
      return;

    const leftWristY = keypoints["left_wrist"].y;
    const rightWristY = keypoints["right_wrist"].y;
    const leftAnkleX = keypoints["left_ankle"].x;
    const rightAnkleX = keypoints["right_ankle"].x;

    const avgShoulderY =
      (keypoints["left_shoulder"].y + keypoints["right_shoulder"].y) / 2;
    const avgHipX = (keypoints["left_hip"].x + keypoints["right_hip"].x) / 2;

    const ankleDistance = Math.abs(leftAnkleX - rightAnkleX);
    const hipWidth = Math.abs(
      keypoints["left_hip"].x - keypoints["right_hip"].x
    );

    // Más tolerancia en las condiciones
    const armsUp =
      leftWristY < avgShoulderY * 0.95 && rightWristY < avgShoulderY * 0.95;
    const armsDown =
      leftWristY > avgShoulderY * 1.05 && rightWristY > avgShoulderY * 1.05;

    const legsOpen = ankleDistance > hipWidth * 1.5;
    const legsClosed = ankleDistance < hipWidth * 1.1;

    const openPose = armsUp && legsOpen;
    const closedPose = armsDown && legsClosed;

    // Debug opcional
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(keypoints["left_wrist"].x, keypoints["left_wrist"].y);
      ctx.lineTo(keypoints["right_wrist"].x, keypoints["right_wrist"].y);
      ctx.moveTo(keypoints["left_ankle"].x, keypoints["left_ankle"].y);
      ctx.lineTo(keypoints["right_ankle"].x, keypoints["right_ankle"].y);
      ctx.strokeStyle = openPose ? "lime" : "red";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Contar frames en cada estado
    if (openPose) {
      framesOpenRef.current++;
      framesClosedRef.current = 0;
    } else if (closedPose) {
      framesClosedRef.current++;
      framesOpenRef.current = 0;
    } else {
      framesOpenRef.current = 0;
      framesClosedRef.current = 0;
    }

    // Fase abierta detectada
    if (framesOpenRef.current >= minFrames && !isJumpingJackRef.current) {
      isJumpingJackRef.current = true;
    }

    // Fase cerrada tras haber estado abierto: cuenta 1 jumping jack
    if (framesClosedRef.current >= minFrames && isJumpingJackRef.current) {
      isJumpingJackRef.current = false;
      setJumpCount((prev) => prev + 1);
      console.log("✅ Jumping Jack detectado");
    }
  }

  //////////////////////////////////jump  // Estados para el salto vertical
  const [groundY, setGroundY] = useState<number | null>(null);
  const isJumpingRef = useRef(false);
  const framesInAirRef = useRef(0);
  const framesOnGroundRef = useRef(0);
  const [onlyJumpCount, setOnlyJumpCount] = useState(0);
  const minFramesJumps = 3; // Mínimo de frames en el aire o en el suelo para confirmar salto

  const calibrationFrames = useRef<number[]>([]);
  const maxCalibrationFrames = 60; // Por ejemplo, 2 segundos si el FPS es 30

  function detectVerticalJump(pose: Pose) {
    const keypoints = Object.fromEntries(
      pose.keypoints.map((k) => [k.name, k])
    );

    const leftAnkle = keypoints["left_ankle"];
    const rightAnkle = keypoints["right_ankle"];

    if (
      !leftAnkle ||
      !rightAnkle ||
      leftAnkle.score! < 0.5 ||
      rightAnkle.score! < 0.5
    )
      return;

    const avgY = (leftAnkle.y + rightAnkle.y) / 2;

    // 🔧 Paso 1: Calibración automática durante los primeros segundos
    if (groundY === null) {
      calibrationFrames.current.push(avgY);
      if (calibrationFrames.current.length >= maxCalibrationFrames) {
        const sum = calibrationFrames.current.reduce((a, b) => a + b, 0);
        const averageGroundY = sum / calibrationFrames.current.length;
        setGroundY(averageGroundY);
        console.log("✅ Calibración completa. GroundY =", averageGroundY);
      }
      return;
    }

    // 🔧 Paso 2: Usar groundY y margen para los umbrales
    const jumpThreshold = groundY - 30; // en el aire
    const groundThreshold = groundY - 10; // tocando suelo

    if (avgY < jumpThreshold) {
      framesInAirRef.current++;
      framesOnGroundRef.current = 0;
      if (framesInAirRef.current >= minFramesJumps && !isJumpingRef.current) {
        isJumpingRef.current = true;
      }
    } else if (avgY > groundThreshold) {
      framesOnGroundRef.current++;
      framesInAirRef.current = 0;
      if (framesOnGroundRef.current >= minFramesJumps && isJumpingRef.current) {
        isJumpingRef.current = false;
        setOnlyJumpCount((prev) => prev + 1);
        console.log("✅ Salto detectado");
      }
    }
  }

  const [debugData, setDebugData] = useState({ leftY: 0, rightY: 0, avgY: 0 });

  function debugPoseValues(pose: Pose) {
    const leftAnkle = pose.keypoints.find((k) => k.name === "left_ankle");
    const rightAnkle = pose.keypoints.find((k) => k.name === "right_ankle");

    if (!leftAnkle || !rightAnkle) return;
    if (leftAnkle.score! < 0.5 || rightAnkle.score! < 0.5) return;

    const avgY = (leftAnkle.y + rightAnkle.y) / 2;

    setDebugData({
      leftY: leftAnkle.y,
      rightY: rightAnkle.y,
      avgY,
    });
  }

  ///////CAMERA PERMISIONS
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function requestCameraAccess() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setError(
          "No se pudo acceder a la cámara. Asegúrate de haber dado permiso."
        );
        console.error("Error accediendo a la cámara:", err);
      }
    }

    if (typeof window !== "undefined" && navigator.mediaDevices) {
      requestCameraAccess();
    }
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto aspect-video">
      {/* <div className="flex relative w-full">
        <div>👣 Left Ankle Y: {debugData.leftY.toFixed(2)}</div>
        <div>👣 Right Ankle Y: {debugData.rightY.toFixed(2)}</div>
        <div>📏 Avg Y: {debugData.avgY.toFixed(2)}</div>
      </div> */}
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          width: "100%",
          height: "100%",
        }}
        autoPlay
        muted
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 2,
          width: "100%",
          height: "100%",
          pointerEvents: "none", // para que no interfiera con clics
        }}
      />

      {/* Overlay contador */}
      <div className="absolute top-2 left-2 bg-white bg-opacity-90 text-black px-3 py-2 rounded-md shadow-md text-sm sm:text-base font-semibold space-y-1 leading-tight max-w-[90vw]">
        <div>🏋️ Sentadillas: {squatCount}</div>
        <div>💪 Flexiones: {pushupCount}</div>
        <div>🤸 Jumping Jacks: {jumpCount}</div>
        <div>⬆️ Saltos: {onlyJumpCount}</div>
        <div>📐 Ángulo: {angle}°</div>
      </div>

      {/* Debug info */}
    </div>
  );
}
