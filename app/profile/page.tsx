import Metricas from "../../components/Metricas";
import Profile from "../../components/Profile";

const ProfilePage = () => {
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
