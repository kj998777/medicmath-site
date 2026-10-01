"use client";

import { useEffect, useRef, useState } from "react";

// 애플 홈페이지처럼 스크롤해서 화면에 들어올 때 아래에서 부드럽게 떠오르는 효과.
// - 한 번 보이면 다시 숨지 않는다(되돌아가며 깜빡이지 않게).
// - "동작 줄이기"(prefers-reduced-motion) 설정이면 애니메이션 없이 바로 보인다 (globals.css).
// - 자바스크립트가 꺼져 있어도 내용은 보인다 (noscript 대비: html에 js 클래스가 있을 때만 숨김).
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "figure";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={"reveal " + (shown ? "is-shown " : "") + className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
