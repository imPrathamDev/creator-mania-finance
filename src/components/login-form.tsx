"üse client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAction } from "next-safe-action/hooks";
import { loginAction } from "@/app/(login)/login/action";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Spinner } from "./ui/spinner";
import { useRouter } from "next/navigation";
import { goeyToast } from "goey-toast";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { execute, isPending, result } = useAction(loginAction);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [isTransitionPending, startTransition] = useTransition();

  const router = useRouter();

  useEffect(() => {
    if (result.data) {
      if (result.data.success) {
        goeyToast.success(result.data.message);
        startTransition(() => {
          router.push("/");
        });
      } else {
        goeyToast.success(result.data.message);
      }
    }
  }, [result]);

  return (
    <div className={cn("pointer-events-auto", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your email & password.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="?type=forgot-password"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </Field>
            <Field>
              <Button
                disabled={isPending}
                onClick={() => {
                  execute({
                    email: form.email,
                    password: form.password,
                  });
                }}
                className="hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <Spinner />
                    Please wait...
                  </>
                ) : isTransitionPending ? (
                  <>
                    <Spinner />
                    Redirecting...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </Field>
          </FieldGroup>

          <FieldDescription className="text-center text-xs">
            <a href="https://www.impratham.dev">Developed By Pratham Sharma.</a>
          </FieldDescription>
        </CardContent>
      </Card>
    </div>
  );
}
