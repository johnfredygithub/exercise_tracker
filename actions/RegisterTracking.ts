"use server";

import prisma from "../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

interface TrakingInterface {
  repetitions: number;
  exerciseName: string;
  notes?: string;
}

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }
  return session.user.id;
}

export const addOrUpdateTracking = async ({
  repetitions,
  exerciseName,
  notes,
}: TrakingInterface) => {
  try {
    const userId = await getUserId();
    // Fecha de hoy a medianoche
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Buscar si ya existe el ejercicio para el usuario
    const existingTracking = await prisma.exerciseTracking.findFirst({
      where: {
        userId,
        exerciseName,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    let tracking;

    if (existingTracking) {
      // Actualizar repeticiones
      tracking = await prisma.exerciseTracking.update({
        where: { id: existingTracking.id },
        data: {
          repetitions: existingTracking.repetitions + repetitions,
          notes: notes ?? existingTracking.notes,
        },
      });
    } else {
      // Crear nuevo registro
      tracking = await prisma.exerciseTracking.create({
        data: {
          repetitions,
          exerciseName,
          notes,
          date: new Date(),
          userId,
        },
      });
    }

    revalidatePath("/");
    return tracking;
  } catch (error: any) {
    return {
      error: error.message ?? error,
      data: {
        repetitions,
        exerciseName,
        notes,
        userId: await getUserId(),
      },
    };
  }
};
