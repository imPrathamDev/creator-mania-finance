import { actionClient } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import z from "zod";

const schema = z.object({
  email: z.string().min(2),
  password: z.string().min(6),
});

export const loginAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput: { email, password } }) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (user === null) {
        return {
          success: false,
          message: "User not found.",
        };
      }

      return {
        success: true,
        message: "Login successfully.",
      };
    } catch (error) {
      console.log(error);

      return {
        success: false,
        message: "Oops! Something went wrong.",
      };
    }
  });
