// 메딕수학 인스타 참고 계정 수집기 (Supabase Edge Function: ig-collect)
// - Meta 공식 Instagram Graph API의 business_discovery로 참고 계정의 공개 게시물 정보를 가져와 저장한다.
// - 토큰: Edge Function 비밀값 META_ACCESS_TOKEN (시스템 사용자 토큰). 선생님이 Supabase 대시보드에서 직접 넣는다.
// - IG_USER_ID 비밀값이 없으면 토큰으로 연결된 페이지에서 medic_math 계정 ID를 찾아 쓴다.
// - pg_cron이 주 2회 호출한다. 누가 주소를 직접 불러도 10분 안에 다시 돌지 않게 막아 둔다.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const GRAPH = "https://graph.facebook.com/v23.0";
const OWN_USERNAME = "medic_math";
const MEDIA_LIMIT = 30;

const MEDIA_FIELDS = [
  "id", "caption", "like_count", "comments_count", "media_type", "media_product_type",
  "permalink", "timestamp", "thumbnail_url", "media_url",
].join(",");

type Media = {
  id: string; caption?: string; like_count?: number; comments_count?: number;
  media_type?: string; media_product_type?: string; permalink?: string; timestamp?: string;
  thumbnail_url?: string; media_url?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function graph(path: string, token: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

async function findOwnIgUserId(token: string): Promise<string> {
  const fromEnv = Deno.env.get("IG_USER_ID")?.trim();
  if (fromEnv) return fromEnv;
  const pages = await graph("me/accounts?fields=instagram_business_account{id,username}&limit=50", token);
  for (const p of pages.data ?? []) {
    const ig = p.instagram_business_account;
    if (ig?.username === OWN_USERNAME) return ig.id;
  }
  const any = (pages.data ?? []).find((p: { instagram_business_account?: { id: string } }) => p.instagram_business_account);
  if (any) return any.instagram_business_account.id;
  throw new Error("토큰으로 연결된 인스타 비즈니스 계정을 찾지 못함 (페이지 연결·토큰 권한 확인)");
}

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const url = new URL(req.url);
  const only = url.searchParams.get("username")?.toLowerCase() ?? null; // 계정 하나만 시험할 때

  // 10분 안에 이미 돈 적이 있으면 건너뜀 (무분별한 호출로 Meta 호출 한도를 쓰지 않게)
  const { data: last } = await supabase.from("ig_runs").select("started_at").order("started_at", { ascending: false }).limit(1);
  const sinceLast = last?.[0] ? Date.now() - new Date(last[0].started_at).getTime() : Infinity;
  if (sinceLast < (only ? 60 * 1000 : 10 * 60 * 1000)) {
    return json({ skipped: only ? "1분 뒤에 다시 시험하세요" : "최근 10분 안에 이미 수집함" });
  }

  const { data: run } = await supabase.from("ig_runs").insert({ note: only ? `시험: ${only}` : null }).select("id").single();
  const finish = async (ok: number, failed: number, note: string | null) => {
    await supabase.from("ig_runs").update({ finished_at: new Date().toISOString(), ok, failed, note }).eq("id", run!.id);
  };

  const token = Deno.env.get("META_ACCESS_TOKEN")?.trim();
  if (!token) {
    await finish(0, 0, "META_ACCESS_TOKEN 비밀값이 아직 없음");
    return json({ error: "META_ACCESS_TOKEN 비밀값이 아직 없음" }, 200);
  }

  let igUserId: string;
  try {
    igUserId = await findOwnIgUserId(token);
  } catch (e) {
    await finish(0, 0, `내 계정 ID 찾기 실패: ${(e as Error).message}`);
    return json({ error: (e as Error).message }, 200);
  }

  let q = supabase.from("ig_accounts").select("username").eq("active", true);
  if (only) q = q.eq("username", only);
  const { data: accounts } = await q;

  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST 날짜
  let ok = 0, failed = 0;
  const results: Record<string, string> = {};

  for (const { username } of accounts ?? []) {
    try {
      const fields =
        `business_discovery.username(${username}){username,name,biography,followers_count,media_count,` +
        `media.limit(${MEDIA_LIMIT}){${MEDIA_FIELDS}}}`;
      const body = await graph(`${igUserId}?fields=${encodeURIComponent(fields)}`, token);
      const bd = body.business_discovery;
      const media: Media[] = bd?.media?.data ?? [];

      await supabase.from("ig_account_stats").upsert({
        username, collected_on: today, name: bd?.name ?? null, biography: bd?.biography ?? null,
        followers_count: bd?.followers_count ?? null, media_count: bd?.media_count ?? null,
      });

      if (media.length) {
        const now = new Date().toISOString();
        await supabase.from("ig_media").upsert(media.map((m) => ({
          id: m.id, username, media_type: m.media_type ?? null, media_product_type: m.media_product_type ?? null,
          caption: m.caption ?? null, permalink: m.permalink ?? null, posted_at: m.timestamp ?? null,
          thumbnail_url: m.thumbnail_url ?? null, media_url: m.media_url ?? null,
          like_count: m.like_count ?? null, comments_count: m.comments_count ?? null, updated_at: now,
        })), { onConflict: "id", ignoreDuplicates: false });
        await supabase.from("ig_media_snapshots").upsert(media.map((m) => ({
          media_id: m.id, collected_on: today, like_count: m.like_count ?? null, comments_count: m.comments_count ?? null,
        })));
      }

      await supabase.from("ig_accounts").update({ last_status: "ok", last_checked: new Date().toISOString() }).eq("username", username);
      results[username] = `ok (${media.length}개)`;
      ok++;
    } catch (e) {
      const msg = (e as Error).message;
      const status = /business|professional|not found|Cannot find|does not exist/i.test(msg) ? `비즈니스계정아님/없음: ${msg}` : msg;
      await supabase.from("ig_accounts").update({ last_status: status.slice(0, 300), last_checked: new Date().toISOString() }).eq("username", username);
      results[username] = status;
      failed++;
    }
  }

  await finish(ok, failed, null);
  return json({ ok, failed, results });
});
