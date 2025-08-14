"use client";

import React, { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import gsap from "gsap";

const Profile = () => {
  const { data: session, status } = useSession();

  // Refs para GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<HTMLParagraphElement[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(
          containerRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.6 }
        )
          .fromTo(
            avatarRef.current,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.6 },
            "-=0.3"
          )
          .fromTo(
            textRefs.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.15, duration: 0.4 },
            "-=0.3"
          )
          .fromTo(
            buttonRef.current,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.4 },
            "-=0.2"
          );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Cargando...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-bold text-red-500">
        No estás autenticado.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="visible-start max-w-md mx-auto p-6 rounded-2xl shadow-lg bg-white mt-10 text-center"
    >
      <div ref={avatarRef} className="mb-4">
        <Image
          src={session.user?.image ?? "/default-avatar.png"}
          alt="Avatar"
          width={120}
          height={120}
          className="rounded-full border-4 border-blue-500 shadow-md"
        />
      </div>

      <h2
        ref={(el) => {
          if (el) textRefs.current.push(el);
        }}
        className="text-2xl font-bold text-gray-800 "
      >
        {session.user?.name ?? "Nombre no disponible"}
      </h2>

      <p
        ref={(el) => {
          if (el) textRefs.current.push(el);
        }}
        className="text-gray-600 mt-2"
      >
        Email: {session.user?.email ?? "Email no disponible"}
      </p>

      <button
        ref={buttonRef}
        onClick={() => signOut()}
        className="mt-6 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default Profile;
