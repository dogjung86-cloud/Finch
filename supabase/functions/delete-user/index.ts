import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "인증 토큰이 없습니다" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 사용자 JWT 검증
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 사용자입니다" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 서비스 역할 클라이언트로 데이터 삭제
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Fly Darwin 세이브 데이터 삭제
    const { error: savesError } = await adminClient
      .from("fly_darwin_saves")
      .delete()
      .eq("user_id", user.id);

    if (savesError) {
      console.error("fly_darwin_saves 삭제 실패:", savesError);
    }

    // 2) 계정 삭제
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: "계정 삭제에 실패했습니다: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "서버 오류가 발생했습니다" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
