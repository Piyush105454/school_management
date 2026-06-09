import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/features/landing/components/LandingPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.email === "dpsface@gmail.com") {
      redirect("/face-scanner");
    }
    if (session.user.role === "OFFICE" || session.user.role === "PRINCIPAL" || session.user.role === "ADMIN") {
      redirect("/office/dashboard");
    } else if (session.user.role === "TEACHER") {
      redirect("/teacher/dashboard");
    } else {
      redirect("/student/dashboard");
    }
  }

  return <LandingPage />;
}
