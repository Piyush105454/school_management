"use client";

import { SessionProvider } from "next-auth/react";
import { InstituteProvider } from "./InstituteProvider";
import { Suspense } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <InstituteProvider>
          {children}
        </InstituteProvider>
      </Suspense>
    </SessionProvider>
  );
}
