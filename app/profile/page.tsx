import Metricas from "../../components/Metricas";
import Profile from "../../components/Profile";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth.config";
import { redirect } from "next/navigation";

const ProfilePage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin?csrf=true");
  }

  return (
    <div className="">
      <div className="flex items-center ">
        <Profile />
      </div>
      <Metricas />
    </div>
  );
};

export default ProfilePage;
