"use client";

import { useState, useRef, useEffect } from "react";
import { addOrUpdateTracking } from "../actions/RegisterTracking";

interface UseExerciseTrackerProps {
  exerciseName: string;
  notes: string;
  repetitions: number;
}

export const useExerciseTracker = () => {
  const handleSave = async ({
    exerciseName,
    notes,
    repetitions,
  }: UseExerciseTrackerProps) => {
    await addOrUpdateTracking({
      repetitions,
      exerciseName,
      notes,
    });
  };

  return { handleSave };
};
