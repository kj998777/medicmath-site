import { notFound } from "next/navigation";
import { adminSlug } from "@/lib/adminPath";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const slug = adminSlug();
  if (!slug) notFound();
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <LoginForm base={"/" + slug} />
    </main>
  );
}
