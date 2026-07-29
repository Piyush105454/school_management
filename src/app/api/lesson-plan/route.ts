import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lessonPlans, classes, subjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveLessonPlan } from "@/features/academy/actions/lessonPlanActions";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, ...formData } = body;

    const teacherId = session.user.id;

    // Convert className to classId by looking up in database
    let classId: number | undefined = formData.classId ? parseInt(formData.classId) : undefined;
    if (!classId && formData.className) {
      const classRecord = await db.query.classes.findFirst({
        where: eq(classes.name, formData.className),
      });
      if (classRecord) {
        classId = classRecord.id;
      }
    }

    // Convert subject to subjectId by looking up in database
    let subjectId: number | undefined = formData.subjectId ? parseInt(formData.subjectId) : undefined;
    if (!subjectId && formData.subject && classId) {
      // Try exact match first
      let subjectRecord = await db.query.subjects.findFirst({
        where: and(
          eq(subjects.name, formData.subject),
          eq(subjects.classId, classId)
        ),
      });
      
      // If no exact match, try case-insensitive search across all subjects for that class
      if (!subjectRecord) {
        const allSubjectsForClass = await db.query.subjects.findMany({
          where: eq(subjects.classId, classId),
        });
        subjectRecord = allSubjectsForClass.find(
          s => s.name.toLowerCase() === formData.subject.toLowerCase()
        );
      }
      
      // Last resort: search across all subjects without classId filter
      if (!subjectRecord) {
        const allSubjects = await db.query.subjects.findMany({});
        subjectRecord = allSubjects.find(
          s => s.name.toLowerCase() === formData.subject.toLowerCase()
        );
      }
      
      if (subjectRecord) {
        subjectId = subjectRecord.id;
      } else {
        console.warn(`Failed to find subject "${formData.subject}" for class ${formData.className || classId}`);
      }
    } else if (!subjectId && formData.subject && !classId) {
      // If no classId was resolved, try to find subject by name alone
      const subjectRecord = await db.query.subjects.findFirst({
        where: eq(subjects.name, formData.subject),
      });
      if (subjectRecord) {
        subjectId = subjectRecord.id;
      } else {
        console.warn(`Failed to find subject "${formData.subject}" without class context`);
      }
    }

    // Build step1Data with metadata
    const step1Data = {
      className: formData.className || "",
      subject: formData.subject || "",
      chapterNo: formData.chapterNo || "",
      chapterName: formData.chapterName || "",
      pageFrom: formData.pageFrom || "",
      pageTo: formData.pageTo || "",
      prepDate: formData.prepDate || new Date().toISOString().split("T")[0],
      deliveryDate: formData.deliveryDate || new Date().toISOString().split("T")[0],
      preparedBy: formData.preparedBy || session.user.name || "",
      reviewerName: formData.reviewerName || "",
      approverName: formData.approverName || "",
      lessonType: formData.lessonType || "EXPLANATION",
    };

    // Build step2Data payload with sharedData and mode-specific data
    const step2DataPayload = {
      sharedData: {
        ...formData,
        ...step1Data,
      },
      explanationData: formData.lessonType === "Q&A" ? {} : formData,
      qaData: formData.lessonType === "Q&A" ? formData : {},
      // also keep root properties for flat parsers
      ...formData,
    };

    const dateToSave = formData.deliveryDate || formData.date || new Date().toISOString().split("T")[0];

    const saveResult = await saveLessonPlan({
      id: id || undefined,
      teacherId,
      classId,
      subjectId,
      date: dateToSave,
      type: formData.lessonType === "Q&A" ? "QA" : "EXPLANATION",
      status: status || "SUBMITTED",
      chapterDivisionId: formData.chapterDivisionId ? parseInt(formData.chapterDivisionId) : undefined,
      step1Data,
      step2Data: step2DataPayload,
    });

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error || "Failed to save lesson plan" },
        { status: 500 }
      );
    }

    // Fetch the updated/created lesson plan record to return with subject relation
    const savedRecord = await db.query.lessonPlans.findFirst({
      where: eq(lessonPlans.id, saveResult.id!),
      with: {
        class: true,
        subject: {
          with: {
            reviewer1: true,
            reviewer2: true,
          }
        },
        teacherProfile: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: saveResult.id,
        ...savedRecord,
      },
      message: saveResult.action === "created" ? "Lesson plan created successfully" : "Lesson plan updated successfully",
    });
  } catch (error: any) {
    console.error("Lesson plan save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save lesson plan" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Fetch specific lesson plan with relationships
      const plan = await db.query.lessonPlans.findFirst({
        where: eq(lessonPlans.id, id),
        with: {
          class: true,
          subject: {
            with: {
              reviewer1: true,
              reviewer2: true,
            }
          },
          chapterDivision: true,
          teacherProfile: true,
        }
      });

      if (!plan) {
        return NextResponse.json(
          { error: "Lesson plan not found" },
          { status: 404 }
        );
      }

      let step1: any = {};
      let step2: any = {};
      
      try {
        if (plan.step1Data && typeof plan.step1Data === 'string') {
          step1 = JSON.parse(plan.step1Data);
          console.log("Parsed step1 from string:", step1);
        } else if (plan.step1Data && typeof plan.step1Data === 'object') {
          step1 = plan.step1Data;
          console.log("Using step1 as object:", step1);
        }
      } catch (e) {
        console.error("Failed to parse step1Data:", e);
      }
      
      try {
        if (plan.step2Data && typeof plan.step2Data === 'string') {
          const parsedStep2 = JSON.parse(plan.step2Data);
          console.log("Parsed step2 from string:", parsedStep2);
          if (parsedStep2.sharedData || parsedStep2.explanationData || parsedStep2.qaData) {
            step2 = {
              ...parsedStep2.sharedData,
              ...parsedStep2.explanationData,
              ...parsedStep2.qaData,
              ...parsedStep2,
            };
            console.log("Flattened step2:", step2);
          } else {
            step2 = parsedStep2;
            console.log("Using step2 as-is:", step2);
          }
        } else if (plan.step2Data && typeof plan.step2Data === 'object') {
          const parsedStep2: any = plan.step2Data;
          console.log("Using step2 as object:", parsedStep2);
          if (parsedStep2.sharedData || parsedStep2.explanationData || parsedStep2.qaData) {
            step2 = {
              ...parsedStep2.sharedData,
              ...parsedStep2.explanationData,
              ...parsedStep2.qaData,
              ...parsedStep2,
            };
            console.log("Flattened step2 from object:", step2);
          } else {
            step2 = parsedStep2;
            console.log("Using step2 object as-is:", step2);
          }
        }
      } catch (e) {
        console.error("Failed to parse step2Data:", e);
      }
      
      const formData = {
        id: plan.id,
        className: plan.class?.name || step1.className || "",
        subject: plan.subject?.name || step1.subject || "",
        chapterNo: step1.chapterNo || "",
        chapterName: step1.chapterName || "",
        pageFrom: step1.pageFrom || "",
        pageTo: step1.pageTo || "",
        lessonType: plan.type === "QA" ? "Q&A" : (step1.lessonType || "Explanation"),
        preparedBy: step1.preparedBy || plan.teacherProfile?.name || "",
        reviewerName: step1.reviewerName || "",
        approverName: step1.approverName || "",
        prepDate: step1.prepDate || plan.date,
        deliveryDate: step1.deliveryDate || plan.date,
        ...step1,
        ...step2,
        reviewerNote: plan.reviewerRemark || step2.reviewerNote || step2.specialistFeedback || "",
        specialistFeedback: plan.reviewerRemark || step2.specialistFeedback || step2.reviewerNote || "",
        approverNote: plan.principalRemark || step2.approverNote || step2.finalApprovalFeedback || "",
        finalApprovalFeedback: plan.principalRemark || step2.finalApprovalFeedback || step2.approverNote || "",
        status: plan.status,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        date: plan.date,
      };

      console.log("API returning formData:", JSON.stringify(formData, null, 2));

      return NextResponse.json({
        success: true,
        data: formData,
      });
    } else {
      // Fetch all lesson plans for the teacher
      const plans = await db.query.lessonPlans.findMany({
        where: eq(lessonPlans.teacherId, session.user.id as any),
        with: {
          class: true,
          subject: {
            with: {
              reviewer1: true,
              reviewer2: true,
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: plans.map(plan => {
          let step1: any = {};
          let step2: any = {};
          
          try {
            if (plan.step1Data && typeof plan.step1Data === 'string') {
              step1 = JSON.parse(plan.step1Data);
            }
          } catch (e) {}
          
          try {
            if (plan.step2Data && typeof plan.step2Data === 'string') {
              const parsedStep2 = JSON.parse(plan.step2Data);
              if (parsedStep2.sharedData || parsedStep2.explanationData || parsedStep2.qaData) {
                step2 = {
                  ...parsedStep2.sharedData,
                  ...parsedStep2.explanationData,
                  ...parsedStep2.qaData,
                  ...parsedStep2,
                };
              } else {
                step2 = parsedStep2;
              }
            }
          } catch (e) {}
          
          return {
            id: plan.id,
            className: plan.class?.name || step1.className || "",
            subject: plan.subject?.name || step1.subject || "",
            lessonType: plan.type === "QA" ? "Q&A" : (step1.lessonType || "Explanation"),
            ...step1,
            ...step2,
            status: plan.status,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
          };
        }),
      });
    }
  } catch (error: any) {
    console.error("Fetch lesson plans error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch lesson plans" },
      { status: 500 }
    );
  }
}
