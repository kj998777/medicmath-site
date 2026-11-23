// 더 이상 쓰지 않음 (2026-11-23). 인스타 수집은 DB 함수 insta.collect()가 한다 (supabase/0034_ig_collector_isolate.sql).
// 토큰이나 DB를 읽지 않는 빈 함수로 바꿔 두었다.
Deno.serve(() => new Response(JSON.stringify({ gone: "insta.collect()로 옮김" }), { status: 410, headers: { "Content-Type": "application/json" } }));
