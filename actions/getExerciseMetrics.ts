"use server";
import {
  format,
  subDays,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

import prisma from "../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth.config";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }
  return session.user.id;
}
////////////////METRICAS
export async function getExerciseMetrics() {
  try {
    const userId = await getUserId();
    const data = await prisma.exerciseTracking.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        repetitions: true,
        exerciseName: true,
        notes: true,
      },
    });

    // Agrupar por fecha
    const grouped = Object.values(
      data.reduce((acc, curr) => {
        const day = format(curr.date, "yyyy-MM-dd");
        if (!acc[day]) {
          acc[day] = {
            date: day,
            count: 0,
            exercises: [],
            notes: curr.notes || "",
            id: curr.id,
          };
        }
        acc[day].count += curr.repetitions;
        acc[day].exercises.push(
          `${curr.exerciseName} (${curr.repetitions} reps)`
        );
        return acc;
      }, {} as Record<string, { date: string; count: number; exercises: string[]; notes: string; id: string }>)
    );

    return grouped;
  } catch (error) {
    return [];
  }
}

//////////////////////////////

// ✅ 1. Repeticiones totales por día / semana / mes y ejercicio más repetido
export async function getTotalsMetrics() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("No autenticado");

  const userId = session.user.id;

  const today = new Date();

  // Día actual
  const daily = await prisma.exerciseTracking.groupBy({
    by: ["exerciseName"],
    where: {
      userId,
      date: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
      },
    },
    _sum: { repetitions: true },
    orderBy: { _sum: { repetitions: "desc" } },
  });

  // Semana actual
  const weekly = await prisma.exerciseTracking.groupBy({
    by: ["exerciseName"],
    where: {
      userId,
      date: {
        gte: startOfWeek(new Date()),
        lte: endOfWeek(new Date()),
      },
    },
    _sum: { repetitions: true },
    orderBy: { _sum: { repetitions: "desc" } },
  });

  // Mes actual
  const monthly = await prisma.exerciseTracking.groupBy({
    by: ["exerciseName"],
    where: {
      userId,
      date: {
        gte: startOfMonth(new Date()),
        lte: endOfMonth(new Date()),
      },
    },
    _sum: { repetitions: true },
    orderBy: { _sum: { repetitions: "desc" } },
  });

  return {
    dailyTotal: daily.reduce((acc, ex) => acc + (ex._sum.repetitions || 0), 0),
    weeklyTotal: weekly.reduce(
      (acc, ex) => acc + (ex._sum.repetitions || 0),
      0
    ),
    monthlyTotal: monthly.reduce(
      (acc, ex) => acc + (ex._sum.repetitions || 0),
      0
    ),
    mostRepeatedToday: daily[0] || null,
    mostRepeatedWeek: weekly[0] || null,
    mostRepeatedMonth: monthly[0] || null,
  };
}

// ✅ 2. Días activos vs. días inactivos (últimos 30 días)
export async function getActiveDaysMetrics() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("No autenticado");

  const userId = session.user.id;

  const last30Days = subDays(new Date(), 30);

  const activeDaysRaw = await prisma.exerciseTracking.findMany({
    where: {
      userId,
      date: { gte: last30Days },
    },
  });

  const activeDays = Array.from(
    new Set(activeDaysRaw.map((d) => d.date.toISOString().split("T")[0]))
  );

  return {
    activeDays: activeDays.length,
    inactiveDays: 30 - activeDays.length,
  };
}

// ✅ 3. Comparativa intersemanal / intermensual
export async function getComparisonMetrics() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("No autenticado");

  const userId = session.user.id;

  // Semana actual y anterior
  const currentWeekTotal = await prisma.exerciseTracking.aggregate({
    _sum: { repetitions: true },
    where: {
      userId,
      date: {
        gte: startOfWeek(new Date()),
        lte: endOfWeek(new Date()),
      },
    },
  });

  const lastWeekTotal = await prisma.exerciseTracking.aggregate({
    _sum: { repetitions: true },
    where: {
      userId,
      date: {
        gte: startOfWeek(subDays(new Date(), 7)),
        lte: endOfWeek(subDays(new Date(), 7)),
      },
    },
  });

  // Mes actual y anterior
  const currentMonthTotal = await prisma.exerciseTracking.aggregate({
    _sum: { repetitions: true },
    where: {
      userId,
      date: {
        gte: startOfMonth(new Date()),
        lte: endOfMonth(new Date()),
      },
    },
  });

  const lastMonthTotal = await prisma.exerciseTracking.aggregate({
    _sum: { repetitions: true },
    where: {
      userId,
      date: {
        gte: startOfMonth(subMonths(new Date(), 1)),
        lte: endOfMonth(subMonths(new Date(), 1)),
      },
    },
  });

  const weekChange =
    lastWeekTotal._sum.repetitions && lastWeekTotal._sum.repetitions > 0
      ? (((currentWeekTotal._sum.repetitions || 0) -
          (lastWeekTotal._sum.repetitions || 0)) /
          (lastWeekTotal._sum.repetitions || 1)) *
        100
      : 0;

  const monthChange =
    lastMonthTotal._sum.repetitions && lastMonthTotal._sum.repetitions > 0
      ? (((currentMonthTotal._sum.repetitions || 0) -
          (lastMonthTotal._sum.repetitions || 0)) /
          (lastMonthTotal._sum.repetitions || 1)) *
        100
      : 0;

  return {
    weekChange: Math.round(weekChange),
    monthChange: Math.round(monthChange),
  };
}
