import React from "react";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KioskScannerClient from "./KioskScannerClient";

export default async function KioskScannerPage() {
  const session = await getServerSession(authOptions);
  
  // 1. Force Authentication
  if (!session?.user) {
    return redirect("/login");
  }

  // 2. Strict Role Gating: Only Office, Teachers, Principal, and Admin allowed. Blocks students.
  const role = session.user.role;
  const allowedRoles = ["ADMIN", "OFFICE", "TEACHER", "PRINCIPAL"];
  
  if (!allowedRoles.includes(role)) {
    return redirect("/student/dashboard"); // Safely bounce student roles back to their dashboard portal
  }

  const allClasses = await db.query.classes.findMany({
    orderBy: (c: any, { asc }: any) => [asc(c.grade)],
  });

  return (
    <KioskScannerClient 
      classes={allClasses} 
      isKioskOnly={session.user.email === "dpsface@gmail.com"} 
    />
  );
}
