// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";
import { getTodayPendingReminders } from "./helpers.ts";
import {
  buildReminderEmailHtml,
  buildReminderEmailSubject,
} from "./reminderEmail.ts";
console.log("Hello from Functions!");

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendKey = Deno.env.get("RESEND_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { reminders, error, date_ist } = await getTodayPendingReminders(
      supabase as any,
    );

    if (error) {
      console.log(error);
      return new Response(
        JSON.stringify({
          success: false,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Don't forget CORS on errors too!
            "Access-Control-Allow-Headers":
              "authorization, x-client-info, apikey, content-type",
          },
        },
      );
    }

    const html = buildReminderEmailHtml(reminders, date_ist);
    const subject = buildReminderEmailSubject(reminders, date_ist);

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "Creator Mania Finance <noreply@updates.creatormania.in>",
      to: ["pratham.sharma2105@gmail.com"],
      subject,
      html,
    });

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Don't forget CORS on errors too!
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      },
    );
  } catch (error) {
    console.log("Err => ", error);
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Don't forget CORS on errors too!
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/notify-reminders' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
