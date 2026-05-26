import React from "react";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import KioskScannerClient from "./KioskScannerClient";

export default async function KioskScannerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <div>Unauthorized</div>;

  const allClasses = await db.query.classes.findMany({
    orderBy: (c: any, { asc }: any) => [asc(c.grade)],
  });

  return (
    <KioskScannerClient classes={allClasses} />
  );
}
