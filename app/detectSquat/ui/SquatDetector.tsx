"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDetector,
  SupportedModels,
  PoseDetector,
  Pose,
} from "@tensorflow-models/pose-detection";
import { initBackend } from "../../../lib/tf";
import { addOrUpdateTracking } from "../../../actions/RegisterTracking";
import { useExerciseTracker } from "../../../hook/useExerciseTracker";

const SquatDetector = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<PoseDetector | null>(null);
  const [squatCount, setSquatCount] = useState(0);
  const [angle, setAngle] = useState(0);
  const isDownRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const { handleSave } = useExerciseTracker();

  useEffect(() => {
    if (squatCount > 0) {
      handleSave({
        repetitions: 1,
        exerciseName: "Sentadillas",
        notes: "notademo",
      });
    }
  }, [squatCount]);

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
        detectSquat(pose, ctx);

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
    return (angle * 180) / Math.PI;
  }

  function detectSquat(pose: Pose, ctx: CanvasRenderingContext2D) {
    const leftHip = pose.keypoints.find((k) => k.name === "left_hip");
    const leftKnee = pose.keypoints.find((k) => k.name === "left_knee");
    const leftAnkle = pose.keypoints.find((k) => k.name === "left_ankle");

    const rightHip = pose.keypoints.find((k) => k.name === "right_hip");
    const rightKnee = pose.keypoints.find((k) => k.name === "right_knee");
    const rightAnkle = pose.keypoints.find((k) => k.name === "right_ankle");

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

    if (avgAngle < 100 && !isDownRef.current) {
      isDownRef.current = true;
    }
    if (avgAngle > 160 && isDownRef.current) {
      isDownRef.current = false;
      setSquatCount((prev) => prev + 1);
    }
  }

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
    <div className="relative w-full max-w-full sm:max-w-3xl md:max-w-5xl mx-auto h-[70vh] sm:h-[80vh] md:h-[90vh] bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Contador */}
      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-black px-4 py-2 rounded-md shadow-md z-30 text-base font-semibold space-y-1">
        <div>🏋️ Sentadillas: {squatCount}</div>
        {/* <div>📐 Ángulo: {angle}°</div> */}
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

      {/* Error */}
      {error && (
        <div className="absolute bottom-3 left-3 bg-red-500 text-white px-4 py-2 rounded-md shadow-md z-30 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default SquatDetector;
