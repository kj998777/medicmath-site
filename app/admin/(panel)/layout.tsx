import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { adminSlug } from "@/lib/adminPath";
import { getStaff } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const slug = adminSlug();
  if (!slug) notFound();
  const base = "/" + slug;

  const { staff, loggedIn, email } = await getStaff();
  if (!loggedIn) redirect(base + "/login");

  if (!staff) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="flex max-w-[420px] flex-col gap-3 rounded-lg border border-line bg-white p-8">
          <h1 className="text-xl font-semibold">접근 권한이 없습니다</h1>
          <p className="text-sm text-muted">{email} 계정은 관리자·편집자 권한이 아닙니다. 메딕차트 관리자에게 권한을 요청해 주세요.</p>
          <SignOutButton base={base} />
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center gap-6 px-5">
          <Image src="/logo.png" alt="메딕수학" width={149} height={30} className="h-[26px] w-auto" />
          <nav className="flex gap-1 text-[15px] font-medium">
            <a href={base} className="rounded px-3 py-2 hover:bg-sand">
              상담 신청 현황
            </a>
            <a href={base + "/content"} className="rounded px-3 py-2 hover:bg-sand">
              사이트 내용 수정
            </a>
            <a href="/" target="_blank" rel="noopener noreferrer" className="rounded px-3 py-2 text-muted hover:bg-sand">
              사이트 보기 ↗
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-muted md:inline">{staff.email}</span>
            <SignOutButton base={base} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-5 py-8 md:py-10">{children}</main>
    </>
  );
}
