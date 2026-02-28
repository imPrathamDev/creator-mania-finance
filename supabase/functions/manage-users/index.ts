import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const ALLOWED_EMAIL = "harsh@creatormania.in";

Deno.serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const resendKey = Deno.env.get("RESEND_KEY") ?? "";
    // Initialize Supabase Admin client (uses service_role key)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── Step 1: Authenticate the caller ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid Authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return json({ error: "Unauthorized: invalid token" }, 401);
    }

    if (caller.email !== ALLOWED_EMAIL) {
      return json(
        { error: `Forbidden: only ${ALLOWED_EMAIL} can perform this action` },
        403,
      );
    }

    // ── Step 2: Parse body ────────────────────────────────────────────────────
    const body = await req.json();
    const { action, email, password, user_id } = body;

    if (!action) {
      return json(
        { error: "Missing required field: action ('create' | 'delete')" },
        400,
      );
    }

    // ── Step 3: Perform action ────────────────────────────────────────────────
    if (action === "create") {
      // Validate required fields
      if (!email || !password) {
        return json(
          { error: "Fields 'email' and 'password' are required for create" },
          400,
        );
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirm email
      });

      if (error) {
        return json({ error: error.message }, 400);
      }

      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Creator Mania Finance <noreply@updates.creatormania.in>",
        to: email,
        subject: "Your Creator Mania Finance Dashboard Access Details.",
        text: `
      Creator Mania Finance Dashboard Access Details:

      Email: ${email},
      Password: ${password},
      Login Link: https://finance.creatormania.in/login
      
      Team Creator Mania Finance.`,
      });

      return json(
        {
          message: "User created successfully",
          user: {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
          },
        },
        201,
      );
    } else if (action === "delete") {
      // Accept either user_id or email for deletion
      let targetUserId = user_id;

      if (!targetUserId) {
        if (!email) {
          return json(
            { error: "Provide 'user_id' or 'email' for delete" },
            400,
          );
        }

        // Look up user by email
        const {
          data: { users },
          error: listError,
        } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
          return json({ error: listError.message }, 500);
        }

        const target = users.find((u) => u.email === email);
        if (!target) {
          return json({ error: `No user found with email: ${email}` }, 404);
        }

        targetUserId = target.id;
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (error) {
        return json({ error: error.message }, 400);
      }

      return json(
        { message: `User ${targetUserId} deleted successfully` },
        200,
      );
    } else {
      return json(
        { error: `Unknown action '${action}'. Use 'create' or 'delete'` },
        400,
      );
    }
  } catch (err) {
    console.error("Edge function error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

// Helper
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
