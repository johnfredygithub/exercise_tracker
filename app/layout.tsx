import "./globals.css";
import { FloatingDockDemo } from "../components/FloatingDockDemo";

import Providers from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export const metadata = {
  title: "ExerciseTrackerFree",
  description: "ExerciseTracker App",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  //////TODO:AÑADIR :OPENGRAPH
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body>
        <Providers>
          {session && <FloatingDockDemo />}
          {children}
        </Providers>
      </body>
    </html>
  );
}
