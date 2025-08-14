"use client";

import React, { useEffect } from "react";
import { FloatingDock } from "./floating-dock";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function FloatingDockDemo() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null; // opcional: spinner o nada mientras verifica
  }

  const links = [
    {
      title: "Squat",
      icon: <Image src="/detectSquat.png" width={90} height={90} alt="Logo" />,
      href: "detectSquat",
    },
    {
      title: "JumpingJacks",
      icon: (
        <Image
          src="/JumpingJacksDetector.png"
          width={90}
          height={90}
          alt="Logo"
        />
      ),
      href: "JumpingJacksDetector",
    },
    {
      title: "pushUp",
      icon: <Image src="/pushUp.png" width={90} height={90} alt="Logo" />,
      href: "pushUp",
    },
    {
      title: "biceps",
      icon: <Image src="/biceps.png" width={90} height={90} alt="Logo" />,
      href: "biceps",
    },
    {
      title: "Profile",
      icon: (
        <Image
          src={session?.user?.image ?? "/default-avatar.png"}
          width={90}
          height={90}
          alt="Profile"
          style={{ borderRadius: "50%" }}
        />
      ),
      href: "profile",
    },
  ];

  return (
    <div className="flex items-center justify-center h-[2rem] w-full md:m-10">
      <FloatingDock mobileClassName="translate-y-0" items={links} />
    </div>
  );
}
