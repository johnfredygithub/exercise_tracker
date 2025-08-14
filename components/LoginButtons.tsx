// components/LoginButtons.tsx (client)
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginButtons() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <img
          src={session.user?.image ?? ""}
          alt="avatar"
          width={32}
          height={32}
        />
        <span>{session.user?.name}</span>
        <button onClick={() => signOut()}>Salir</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => signIn("google")}>Entrar con Google</button>
      <button onClick={() => signIn("github")}>Entrar con GitHub</button>
    </div>
  );
}
