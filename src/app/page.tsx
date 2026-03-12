import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/features/landing/components/LandingPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === "OFFICE") {
      redirect("/office/dashboard");
    } else {
      redirect("/student/dashboard");
    }
  }

  return <LandingPage />;
}
