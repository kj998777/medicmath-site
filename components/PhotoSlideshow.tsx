"use client";

import { useEffect, useState } from "react";

// 자습실·수업 사진 자동 슬라이드.
// - 5초마다 다음 사진으로 서서히 겹쳐 바뀌고(크로스페이드), 사진은 천천히 확대된다(켄 번스 효과).
// - 아래 점을 누르면 그 사진으로. 마우스를 올리면 잠시 멈춤. 화면 밖이거나 탭이 숨겨지면 넘기지 않음.
// - 동작 줄이기 설정이면 확대 효과 없이 바뀌기만 한다.
// - 사진이 없으면 자리 표시, 1장이면 슬라이드 없이 그 사진만.
export default function PhotoSlideshow({ photos, className = "", interval = 5000 }: { photos: string[]; className?: string; interval?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = photos.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setI((v) => (v + 1) % count);
    }, interval);
    return () => window.clearInterval(id);
  }, [count, paused, interval]);

  if (count === 0) {
    return (
      <div className={"placeholder-box border-[#5A534A] bg-[#2A2722] text-[#9A9186] " + className}>[자습실 · 수업 사진]</div>
    );
  }

  return (
    <div
      className={"relative overflow-hidden bg-[#2A2722] " + className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="메딕수학 자습실·수업 사진"
    >
      {photos.map((src, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + k}
          src={src}
          alt={`메딕수학 자습실·수업 모습 ${k + 1}`}
          loading={k === 0 ? "eager" : "lazy"}
          className={"slide-img absolute inset-0 h-full w-full object-cover " + (k === i ? "is-active" : "")}
          aria-hidden={k !== i}
        />
      ))}
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/40 to-transparent pb-3 pt-8">
          {photos.map((_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              aria-label={`${k + 1}번째 사진 보기`}
              aria-current={k === i}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span className={"block h-1.5 rounded-full transition-all duration-500 " + (k === i ? "w-5 bg-white" : "w-1.5 bg-white/50")} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
