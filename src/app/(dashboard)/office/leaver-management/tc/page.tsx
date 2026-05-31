import React from "react";
import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  students,
  classes,
  admissionMeta,
  studentBio,
  parentGuardianDetails,
  studentAddress,
  inquiries,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import TCClient from "./TCClient";

export default async function TCPage() {
  await protectRoute(["OFFICE", "PRINCIPAL"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Fetch all academy students with class info
  const academyStudents = await db
    .select({
      id: students.id,
      studentId: students.studentId,
      name: students.name,
      rollNumber: students.rollNumber,
      scholarNumber: students.scholarNumber,
      classId: students.classId,
      className: classes.name,
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id))
    .orderBy(students.name);

  // Fetch all admission metas to cross-reference scholar number
  const admMetas = await db
    .select({
      id: admissionMeta.id,
      entryNumber: admissionMeta.entryNumber,
      admissionNumber: admissionMeta.admissionNumber,
      scholarNumber: admissionMeta.scholarNumber,
      academicYear: admissionMeta.academicYear,
      createdAt: admissionMeta.createdAt,
    })
    .from(admissionMeta);

  // Fetch student bio info (DOB, gender, caste, religion, aadhaar, samagra)
  const bios = await db
    .select({
      admissionId: studentBio.admissionId,
      firstName: studentBio.firstName,
      middleName: studentBio.middleName,
      lastName: studentBio.lastName,
      gender: studentBio.gender,
      dob: studentBio.dob,
      caste: studentBio.caste,
      religion: studentBio.religion,
      aadhaarNumber: studentBio.aadhaarNumber,
      samagraId: studentBio.samagraId,
    })
    .from(studentBio);

  // Fetch parent/guardian details (father, mother)
  const parents = await db
    .select({
      admissionId: parentGuardianDetails.admissionId,
      personType: parentGuardianDetails.personType,
      name: parentGuardianDetails.name,
    })
    .from(parentGuardianDetails);

  // Fetch address info
  const addresses = await db
    .select({
      admissionId: studentAddress.admissionId,
      village: studentAddress.village,
      tehsil: studentAddress.tehsil,
      district: studentAddress.district,
      state: studentAddress.state,
    })
    .from(studentAddress);

  // Fetch inquiries for extra parent info fallback
  const inquiryList = await db
    .select({
      entryNumber: inquiries.entryNumber,
      parentName: inquiries.parentName,
      appliedClass: inquiries.appliedClass,
    })
    .from(inquiries);

  // Build lookup maps
  const metaByEntry: Record<string, any> = {};
  admMetas.forEach(m => { metaByEntry[m.entryNumber] = m; });

  const bioByAdmission: Record<string, any> = {};
  bios.forEach(b => { bioByAdmission[b.admissionId] = b; });

  const parentsByAdmission: Record<string, any[]> = {};
  parents.forEach(p => {
    if (!parentsByAdmission[p.admissionId]) parentsByAdmission[p.admissionId] = [];
    parentsByAdmission[p.admissionId].push(p);
  });

  const addressByAdmission: Record<string, any> = {};
  addresses.forEach(a => { addressByAdmission[a.admissionId] = a; });

  const inquiryByEntry: Record<string, any> = {};
  inquiryList.forEach(i => { if (i.entryNumber) inquiryByEntry[i.entryNumber] = i; });

  // Enrich academy students with all available data
  const enrichedStudents = academyStudents.map(student => {
    const meta = metaByEntry[student.studentId] || null;
    const bio = meta ? bioByAdmission[meta.id] : null;
    const parentsArr = meta ? (parentsByAdmission[meta.id] || []) : [];
    const address = meta ? addressByAdmission[meta.id] : null;
    const inquiry = meta ? inquiryByEntry[meta.entryNumber] : null;

    const father = parentsArr.find(p =>
      p.personType?.toUpperCase().includes("FATHER") ||
      p.personType?.toUpperCase().includes("DAD")
    );
    const mother = parentsArr.find(p =>
      p.personType?.toUpperCase().includes("MOTHER") ||
      p.personType?.toUpperCase().includes("MOM")
    );

    return {
      ...student,
      // From meta
      admissionNumber: meta?.admissionNumber || null,
      scholarNumber: student.scholarNumber || meta?.scholarNumber || null,
      academicYear: meta?.academicYear || null,
      metaCreatedAt: meta?.createdAt || null,
      // From bio
      gender: bio?.gender || null,
      dob: bio?.dob || null,
      caste: bio?.caste || null,
      religion: bio?.religion || null,
      aadhaarNumber: bio?.aadhaarNumber || null,
      samagraId: bio?.samagraId || null,
      // From parents
      father: father ? { name: father.name } : null,
      mother: mother ? { name: mother.name } : null,
      parentName: inquiry?.parentName || null,
      // From address
      village: address?.village || null,
      tehsil: address?.tehsil || null,
      district: address?.district || null,
      state: address?.state || null,
      // Class
      appliedClass: inquiry?.appliedClass || null,
      createdAt: meta?.createdAt || null,
    };
  });

  return <TCClient students={enrichedStudents} />;
}
