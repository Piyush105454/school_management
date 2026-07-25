import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // TODO: Save to database
    // const lessonPlan = await db.insert(lessonPlans).values({
    //   teacherId: session.user.id,
    //   className: data.className,
    //   subject: data.subject,
    //   ...data
    // });

    return NextResponse.json({ 
      success: true, 
      message: "Lesson plan saved successfully",
      // id: lessonPlan.id 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Fetch lesson plans
    // const plans = await db.query.lessonPlans.findMany({
    //   where: eq(lessonPlans.teacherId, session.user.id)
    // });

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
