"use client";

import { useState } from "react";
import Image from "next/image";
import { nav } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between pl-5 pr-3 md:h-[88px] md:px-24">
        <a href="#top" aria-label="메딕수학 처음으로" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="메딕수학 MEDIC MATH ACADEMY" width={219} height={44} priority className="h-[30px] w-auto md:h-[44px]" />
        </a>

        <nav className="hidden gap-10 text-base font-medium lg:flex" aria-label="주요 메뉴">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-brand">
              {n.label}
            </a>
          ))}
        </nav>

        <a
          href="#consult"
          className="hidden rounded bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-black lg:inline-block"
        >
          입학 테스트 신청
        </a>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-white lg:hidden" aria-label="모바일 메뉴">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line px-5 py-4 text-base font-medium"
            >
              {n.label}
            </a>
          ))}
          <div className="p-5">
            <a
              href="#consult"
              onClick={() => setOpen(false)}
              className="flex h-[52px] items-center justify-center rounded bg-brand font-semibold text-white"
            >
              입학 테스트 신청
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
