import SquatDetector from "./ui/SquatDetector";

/////TODO:POR ANADIR METADATA Y INSTRUCCIONES DE USO DE EL CONTADOR

export const metadata = {
  title: "Squat Detector",
  description: "Detects and counts squats in real-time using PoseNet.",
};
export default async function pageSquat() {
  return <SquatDetector />;
}
