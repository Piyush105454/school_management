import { db } from '../src/db';
import { lessonPlans, teachers } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function main() {
  const plan = await db.query.lessonPlans.findFirst({
    where: eq(lessonPlans.id, 'LP-2627-DEMO-TEST-0003'),
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
      reviewerProfile: true,
    }
  });

  if (!plan) {
    console.log("Plan not found");
    return;
  }

  const reviewerName = await (async () => {
    const hasBeenReviewed = ["REVIEWED", "APPROVED", "COMPLETED"].includes(plan.status);
    if (hasBeenReviewed && plan.reviewerId) {
      const reviewerTeacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, plan.reviewerId)
      });
      if (reviewerTeacher) return reviewerTeacher.name;
    }
    const assigned = [];
    if (plan.subject?.reviewer1?.name) assigned.push(plan.subject.reviewer1.name);
    if (plan.subject?.reviewer2?.name) assigned.push(plan.subject.reviewer2.name);
    return assigned.length > 0 ? assigned.join(" | ") : "Specialist";
  })();

  const approverName = await (async () => {
    if (plan.approverId) {
      const approverTeacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, plan.approverId)
      });
      if (approverTeacher) return approverTeacher.name;
    }
    return "Academic Committee";
  })();

  console.log("Plan status:", plan.status);
  console.log("Plan approverId:", plan.approverId);
  console.log("Resolved reviewerName:", reviewerName);
  console.log("Resolved approverName:", approverName);
}

main();
