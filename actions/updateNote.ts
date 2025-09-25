"use server";

import prisma from "../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth.config";
import { revalidatePath } from "next/cache";

interface TrakingInterface {
  id: string;
  notes: string;
}

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }
  return session.user.id;
}

export const updateNoteTracking = async ({ id, notes }: TrakingInterface) => {
  try {
    const userId = await getUserId();

    // Buscar si ya existe el ejercicio para el usuario
    const existingTracking = await prisma.exerciseTracking.findFirst({
      where: {
        userId,
        id,
      },
    });

    let updateTracking;

    if (existingTracking) {
      // Actualizar repeticiones
      updateTracking = await prisma.exerciseTracking.update({
        where: { id: existingTracking.id, userId },
        data: {
          notes: notes,
        },
      });
    }

    revalidatePath("/");
    return updateTracking;
  } catch (error: any) {
    return {
      error: error.message ?? error,
      data: {
        notes,
        userId: await getUserId(),
      },
    };
  }
};
