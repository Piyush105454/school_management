export const dynamic = "force-dynamic";

import React from "react";
import { protectRoute } from "@/lib/roleGuard";
import TransportClient from "./TransportClient";

export default async function OfficeTransportPage() {
  // Guard the route to only allow OFFICE, PRINCIPAL, and ADMIN
  await protectRoute(["OFFICE", "PRINCIPAL", "ADMIN"]);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <TransportClient />
    </div>
  );
}
