import MetricasXExercise from "@/components/MetricasXExercise";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth.config";
import { redirect } from "next/navigation";

const PageMetricasTbl = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin?csrf=true");
  }

  return <MetricasXExercise />;
};

export default PageMetricasTbl;
