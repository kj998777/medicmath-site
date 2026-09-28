"use client";

import { signOut } from "../actions";

export default function SignOutButton({ base, className }: { base: string; className?: string }) {
  return (
    <button
      type="button"
      className={className ?? "text-sm text-muted underline hover:text-ink"}
      onClick={async () => {
        await signOut();
        window.location.href = base + "/login";
      }}
    >
      로그아웃
    </button>
  );
}
