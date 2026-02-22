import { ChartNoAxesCombined, GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import ColorBends from "@/components/custom/ColorBends";

export default function LoginPage() {
  return (
    <div className="bg-background h-svh overflow-hidden">
      <ColorBends
        colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
        rotation={0}
        speed={0.2}
        scale={1}
        frequency={1}
        warpStrength={1}
        mouseInfluence={1}
        parallax={0.5}
        noise={0.1}
        transparent
        autoRotate={0}
        // color="#09090b"
      />

      <div className="pointer-events-none absolute top-0 left-0 w-full flex max-h-svh min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a
            href="#"
            className="pointer-events-auto flex items-center gap-4 self-center font-medium"
          >
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
              <ChartNoAxesCombined className="size-7" />
            </div>
            <div className="-space-y-1 mix-blend-difference">
              <p className="font-medium">Creator Mania</p>
              <p className="text-sm font-light tracking-widest">Finance</p>
            </div>
          </a>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
