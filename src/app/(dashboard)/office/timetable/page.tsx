export const dynamic = "force-dynamic";

import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { protectRoute } from "@/lib/roleGuard";
import TimetableClient from "./TimetableClient";

export default async function TimetablePage() {
  // Enforce security role guard: OFFICE, PRINCIPAL, and ADMIN roles allowed
  await protectRoute(["OFFICE", "PRINCIPAL", "ADMIN"]);

  const session = await getServerSession(authOptions);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <TimetableClient />
    </div>
  );
}
