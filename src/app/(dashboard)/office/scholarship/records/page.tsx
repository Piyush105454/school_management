import { Metadata } from "next";
import RecordsClient from "./RecordsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Scholarship Records | Admin Dashboard",
  description: "View and manage scholarship records and monthly dues",
};

export default async function ScholarshipRecordsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PRINCIPAL" && session.user.role !== "OFFICE")) {
    redirect("/login");
  }

  return <RecordsClient />;
}
