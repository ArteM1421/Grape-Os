import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { action, username, password, activationKey, deviceId, deviceName } =
      await req.json();

    if (action === "register") {
      // Register new user
      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: "Username and password required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const passwordHash = await sha256(password);

      // Check if user exists
      const { data: existing } = await supabase
        .from("vinhost_users")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Username already taken" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      let tier = "free";
      let userId: string;

      // Check activation key if provided
      if (activationKey) {
        const { data: keyRow } = await supabase
          .from("activation_keys")
          .select("id, is_used")
          .eq("key_value", activationKey)
          .maybeSingle();

        if (!keyRow) {
          return new Response(
            JSON.stringify({ error: "Invalid activation key" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        if (keyRow.is_used) {
          return new Response(
            JSON.stringify({ error: "Activation key already used" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        tier = "pro";
      }

      // Create user
      const { data: newUser, error: createErr } = await supabase
        .from("vinhost_users")
        .insert({
          username,
          password_hash: passwordHash,
          tier,
          display_name: username,
        })
        .select("id, tier")
        .single();

      if (createErr || !newUser) {
        return new Response(
          JSON.stringify({ error: "Registration failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      userId = newUser.id;

      // Mark key as used
      if (activationKey) {
        await supabase
          .from("activation_keys")
          .update({ is_used: true, used_by: userId })
          .eq("key_value", activationKey);
      }

      // Register device
      if (deviceId) {
        await supabase.from("device_registrations").upsert({
          user_id: userId,
          device_id: deviceId,
          device_name: deviceName ?? null,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId,
          tier,
          username,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "login") {
      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: "Username and password required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const passwordHash = await sha256(password);

      const { data: user } = await supabase
        .from("vinhost_users")
        .select("id, username, tier, password_hash, display_name")
        .eq("username", username)
        .maybeSingle();

      if (!user || user.password_hash !== passwordHash) {
        return new Response(
          JSON.stringify({ error: "Invalid username or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Register device on login
      if (deviceId) {
        await supabase.from("device_registrations").upsert({
          user_id: user.id,
          device_id: deviceId,
          device_name: deviceName ?? null,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId: user.id,
          tier: user.tier,
          username: user.username,
          displayName: user.display_name,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "activate") {
      // Add pro tier to existing user via key
      if (!username || !password || !activationKey) {
        return new Response(
          JSON.stringify({ error: "Username, password, and activation key required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const passwordHash = await sha256(password);

      const { data: user } = await supabase
        .from("vinhost_users")
        .select("id, password_hash, tier")
        .eq("username", username)
        .maybeSingle();

      if (!user || user.password_hash !== passwordHash) {
        return new Response(
          JSON.stringify({ error: "Invalid username or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (user.tier === "pro") {
        return new Response(
          JSON.stringify({ error: "Account already has Pro tier" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: keyRow } = await supabase
        .from("activation_keys")
        .select("id, is_used")
        .eq("key_value", activationKey)
        .maybeSingle();

      if (!keyRow) {
        return new Response(
          JSON.stringify({ error: "Invalid activation key" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (keyRow.is_used) {
        return new Response(
          JSON.stringify({ error: "Activation key already used" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      await supabase
        .from("vinhost_users")
        .update({ tier: "pro" })
        .eq("id", user.id);

      await supabase
        .from("activation_keys")
        .update({ is_used: true, used_by: user.id })
        .eq("key_value", activationKey);

      return new Response(
        JSON.stringify({
          success: true,
          userId: user.id,
          tier: "pro",
          username,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
