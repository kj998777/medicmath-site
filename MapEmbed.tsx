"use client";

import { useState } from "react";

// 구글 지도 임베드는 페이지를 스크롤하다 지도 위를 지나가면 "Ctrl + 스크롤로 확대" 같은 안내가 크게 뜬다.
// 그래서 평소에는 지도 위에 투명한 막을 덮어 스크롤·드래그가 페이지로 가게 하고,
// 지도를 한 번 클릭(탭)했을 때만 막을 치워 확대·이동이 되게 한다. 마우스가 지도를 벗어나면 다시 덮는다.
export default function MapEmbed({ src, title }: { src: string; title: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className="relative h-full w-full" onMouseLeave={() => setActive(false)}>
      <iframe
        title={title}
        src={src}
        className="block h-[260px] w-full border-0 md:h-[320px] lg:h-full lg:min-h-[360px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      {!active && (
        <button
          type="button"
          aria-label="지도 조작하기 (확대·이동)"
          onClick={() => setActive(true)}
          className="group absolute inset-0 flex cursor-pointer items-end justify-end bg-transparent p-3"
        >
          <span className="rounded bg-white/90 px-2.5 py-1 text-xs font-medium text-muted opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            클릭하면 지도를 움직일 수 있어요
          </span>
        </button>
      )}
    </div>
  );
}
