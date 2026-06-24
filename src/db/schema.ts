import { pgTable, text, serial, timestamp, boolean, integer, doublePrecision, pgEnum, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["OFFICE", "STUDENT_PARENT", "TEACHER", "PRINCIPAL", "ADMIN"]);
export const inquiryStatusEnum = pgEnum("inquiry_status", ["PENDING", "SHORTLISTED", "REJECTED"]);
export const admissionTypeEnum = pgEnum("admission_type", ["NEW", "RE_ADMISSION"]);
export const genderEnum = pgEnum("gender", ["M", "F", "O"]);
export const casteEnum = pgEnum("caste", ["GEN", "OBC", "ST", "SC"]);
export const documentStatusEnum = pgEnum("document_status", ["SUBMITTED", "NOT_SUBMITTED", "VERIFIED", "REJECTED"]);
export const testStatusEnum = pgEnum("test_status", ["NOT_SCHEDULED", "PENDING", "PASS", "FAIL"]);
export const lessonPlanStatusEnum = pgEnum("lesson_plan_status", ["DRAFT", "SUBMITTED", "REVIEWED", "APPROVED", "REJECTED", "COMPLETED"]);
export const homeworkSubmissionStatusEnum = pgEnum("homework_submission_status", ["PENDING", "COMPLETED", "REJECTED"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("OFFICE").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  studentName: text("student_name"),
  parentName: text("parent_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  appliedClass: text("applied_class").notNull(),
  school: text("school"),
  academicYear: text("academic_year").notNull(),
  status: inquiryStatusEnum("status").default("PENDING").notNull(),
  entryNumber: text("entry_number").unique(),
  aadhaarNumber: text("aadhaar_number").unique(),
  passwordPlain: text("password_plain"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const admissionMeta = pgTable("admission_meta", {
  id: uuid("id").defaultRandom().primaryKey(),
  inquiryId: uuid("inquiry_id").notNull().references(() => inquiries.id, { onDelete: 'cascade' }).unique(),
  academicYear: text("academic_year").notNull(),
  admissionType: admissionTypeEnum("admission_type").default("NEW").notNull(),
  previouslyAppliedYear: text("previously_applied_year"),
  entryNumber: text("entry_number").notNull().unique(),
  admissionNumber: text("admission_number").unique(),
  scholarNumber: text("scholar_number").unique(),
  appliedScholarship: boolean("applied_scholarship"),
  awardedScholarship: boolean("awarded_scholarship").default(false).notNull(),
  scholarshipAmount: integer("scholarship_amount").default(0).notNull(),
  officeRemarks: text("office_remarks"),
  documentRemarks: text("document_remarks"),
  verificationRemarks: text("verification_remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  admissionMetaId: uuid("admission_meta_id").references(() => admissionMeta.id),
  admissionStep: integer("admission_step").default(1).notNull(),
  isFullyAdmitted: boolean("is_fully_admitted").default(false).notNull(),
});

export const studentBio = pgTable("student_bio", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  gender: genderEnum("gender").notNull(),
  dob: timestamp("dob").notNull(),
  age: integer("age").notNull(),
  religion: text("religion"),
  caste: casteEnum("caste").notNull(),
  familyId: text("family_id"),
  bloodGroup: text("blood_group"),
  heightCm: doublePrecision("height_cm"),
  weightKg: doublePrecision("weight_kg"),
  aadhaarNumber: text("aadhaar_number"),
  samagraId: text("samagra_id"),
  cwsn: boolean("cwsn").default(false).notNull(),
  cwsnProblemDesc: text("cwsn_problem_desc"),
  studentPhoto: text("student_photo"),
});

export const studentAddress = pgTable("student_address", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  houseNo: text("house_no").notNull(),
  wardNo: text("ward_no"),
  street: text("street").notNull(),
  village: text("village").notNull(),
  tehsil: text("tehsil"),
  district: text("district"),
  state: text("state"),
  pinCode: text("pin_code"),
});

export const studentBankDetails = pgTable("student_bank_details", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  bankName: text("bank_name"),
  accountHolderName: text("account_holder_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  note: text("note"),
});

export const previousAcademic = pgTable("previous_academic", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  schoolName: text("school_name").notNull(),
  schoolType: text("school_type").notNull(),
  apaarId: text("apaar_id"),
  penNumber: text("pen_number"),
  classLastAttended: text("class_last_attended"),
  sessionYear: text("session_year"),
  marksObtained: doublePrecision("marks_obtained"),
  totalMarks: doublePrecision("total_marks"),
  percentage: doublePrecision("percentage"),
  passFail: text("pass_fail"),
});

export const siblingDetails = pgTable("sibling_details", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }),
  siblingNumber: integer("sibling_number").notNull(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: genderEnum("gender"),
  classCurrent: text("class_current"),
  schoolName: text("school_name"),
});

export const parentGuardianDetails = pgTable("parent_guardian_details", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }),
  personType: text("person_type").notNull(),
  isSingleParent: boolean("is_single_parent").default(false).notNull(),
  legalGuardianType: text("legal_guardian_type"),
  name: text("name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  occupation: text("occupation"),
  qualification: text("qualification"),
  aadhaarNumber: text("aadhaar_number"),
  samagraNumber: text("samagra_number"),
  relation: text("relation"),
  officeShopName: text("office_shop_name"),
  jobDetails: text("job_details"),
  photo: text("photo"),
});

export const declarations = pgTable("declarations", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  declarationAccepted: boolean("declaration_accepted").default(false).notNull(),
  guardianName: text("guardian_name").notNull(),
  signatureFile: text("signature_file"),
  declarationDate: timestamp("declaration_date").defaultNow().notNull(),
});

export const documentChecklists = pgTable("document_checklists", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  birthCertificate: documentStatusEnum("birth_certificate").default("NOT_SUBMITTED").notNull(),
  previousMarksheet: documentStatusEnum("previous_marksheet").default("NOT_SUBMITTED").notNull(),
  studentPhotos3: documentStatusEnum("student_photos_3").default("NOT_SUBMITTED").notNull(),
  casteCertificate: documentStatusEnum("caste_certificate").default("NOT_SUBMITTED").notNull(),
  parentAffidavit: documentStatusEnum("parent_affidavit").default("NOT_SUBMITTED").notNull(),
  scholarshipLetter: documentStatusEnum("scholarship_letter").default("NOT_SUBMITTED").notNull(),
  transferCertificate: documentStatusEnum("transfer_certificate").default("NOT_SUBMITTED").notNull(),
  formReceivedComplete: boolean("form_received_complete").default(false).notNull(),
  receivedByName: text("received_by_name"),
  principalSignDate: timestamp("principal_sign_date"),
  anyOtherDetails: text("any_other_details"),
  verifiedAt: timestamp("verified_at"),
});

export const studentDocuments = pgTable("student_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  birthCertificate: text("birth_certificate"),
  studentPhoto: text("student_photo"),
  marksheet: text("marksheet"),
  casteCertificate: text("caste_certificate"),
  affidavit: text("affidavit"),
  transferCertificate: text("transfer_certificate"),
  scholarshipSlip: text("scholarship_slip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const entranceTests = pgTable("entrance_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  testDate: text("test_date"),
  testTime: text("test_time"),
  location: text("location"),
  teacherName: text("teacher_name"),
  contactNumber: text("contact_number"),
  status: testStatusEnum("status").default("NOT_SCHEDULED").notNull(),
  resultDate: timestamp("result_date"),
  marksObtained: doublePrecision("marks_obtained"),
  graceMarks: doublePrecision("grace_marks"),
  totalMarks: doublePrecision("total_marks"),
  reportLink: text("report_link"),
  remarks: text("remarks"),
  adminRemarks: text("admin_remarks"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teachers = pgTable("teachers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
  institute: text("institute"),
  responsibility: text("responsibility"),
  incharge: text("incharge"),
  specialization: text("specialization"),
  assignedRole: text("assigned_role"),
  classAssigned: text("class_assigned"),
  committees: text("committees"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scholarshipStatusEnum = pgEnum("scholarship_status", ["PENDING", "APPROVED", "PAID"]);

export const scholarshipCriteriaSettings = pgTable("scholarship_criteria_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  academicYear: text("academic_year").notNull(),
  admissionId: uuid("admission_id").references(() => admissionMeta.id, { onDelete: 'cascade' }),
  attendanceThreshold: integer("attendance_threshold").default(90).notNull(),
  attendanceAmount: integer("attendance_amount").default(750).notNull(),
  homeworkThreshold: integer("homework_threshold").default(90).notNull(),
  homeworkAmount: integer("homework_amount").default(750).notNull(),
  guardianRatingThreshold: integer("guardian_rating_threshold").default(8).notNull(),
  guardianAmount: integer("guardian_amount").default(750).notNull(),
  ptmAmount: integer("ptm_amount").default(750).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    academicYearAdmissionIdx: uniqueIndex("academic_year_admission_idx").on(table.academicYear, table.admissionId),
  };
});

export const scholarshipAttendance = pgTable("scholarship_attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }),
  month: text("month").notNull(),
  year: text("year").notNull(),
  totalDays: integer("total_days").notNull(),
  presentDays: integer("present_days").notNull(),
  percentage: doublePrecision("percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scholarshipHomework = pgTable("scholarship_homework", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }),
  month: text("month").notNull(),
  year: text("year").notNull(),
  totalGiven: integer("total_given").notNull(),
  totalDone: integer("total_done").notNull(),
  percentage: doublePrecision("percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scholarshipGuardian = pgTable("scholarship_guardian", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }),
  month: text("month").notNull(),
  year: text("year").notNull(),
  rating: integer("rating").notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scholarshipPtm = pgTable("scholarship_ptm", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }),
  month: text("month").notNull(),
  year: text("year").notNull(),
  attended: boolean("attended").default(false).notNull(),
  parentImages: text("parent_images"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scholarshipRecords = pgTable("scholarship_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }),
  month: text("month").notNull(),
  year: text("year").notNull(),

  attendanceAmount: integer("attendance_amount").notNull(),
  homeworkAmount: integer("homework_amount").notNull(),
  guardianAmount: integer("guardian_amount").notNull(),
  ptmAmount: integer("ptm_amount").notNull(),
  totalAmount: integer("total_amount").notNull(),

  adjustmentAmount: integer("adjustment_amount").default(0).notNull(),
  adjustmentNote: text("adjustment_note"),

  status: scholarshipStatusEnum("status").default("PENDING").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Academy Management ---

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: integer("grade").notNull().default(0),
  institute: text("institute"),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id),
  studentId: text("student_id").unique().notNull(),
  name: text("name").notNull(),
  rollNumber: text("roll_number"),
  scholarNumber: text("scholar_number"),
  faceEmbedding: text("face_embedding"), // Store JSON-serialized face vector coordinates
});

export const overallAttendance = pgTable("overall_attendance", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  day: text("day"),
  month: text("month"),
  year: integer("year"),
  total: integer("total"),
  present: integer("present"),
  absent: integer("absent"),
  attendancePct: integer("attendance_pct"),
}, (table) => ({
  monthYearIdx: index("overall_month_year_idx").on(table.month, table.year),
  dateIdx: index("overall_date_idx").on(table.date),
}));

export const studentAttendance = pgTable("student_attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  classId: integer("class_id").references(() => classes.id),
  date: timestamp("date").notNull(),
  day: text("day"),
  month: text("month"),
  year: integer("year"),
  status: text("status"), // P, A, L, ML, HD, H
}, (table) => ({
  studentDateIdx: index("student_attendance_date_idx").on(table.studentId, table.date),
  monthYearIdx: index("student_attendance_month_year_idx").on(table.month, table.year),
}));

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  bookName: text("book_name"),
  medium: text("medium").default("English/Hindi").notNull(),
  assignedTeacherId: uuid("assigned_teacher_id").references(() => teachers.id, { onDelete: 'set null' }),
  reviewerId1: uuid("reviewer_id_1").references(() => teachers.id, { onDelete: 'set null' }),
  reviewerId2: uuid("reviewer_id_2").references(() => teachers.id, { onDelete: 'set null' }),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  orderNo: integer("order_no").notNull(),
});

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  chapterNo: integer("chapter_no").notNull(),
  pageStart: integer("page_start").notNull(),
  pageEnd: integer("page_end").notNull(),
  orderNo: integer("order_no").notNull(),
});

export const chapterPdfs = pgTable("chapter_pdfs", {
  id: uuid("id").defaultRandom().primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  fileUrl: text("file_url").notNull(),
  uploadedBy: text("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const chapterDivisions = pgTable("chapter_divisions", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  pageStart: integer("page_start").notNull(),
  pageEnd: integer("page_end").notNull(),
  orderNo: integer("order_no").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonPlans = pgTable("lesson_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id").references(() => users.id),
  classId: integer("class_id").references(() => classes.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  date: text("date").notNull(),
  type: text("type").default("EXPLANATION").notNull(), // EXPLANATION, QA
  chapterDivisionId: integer("chapter_division_id").references(() => chapterDivisions.id),
  step1Data: text("step1_data"), // JSON string
  step2Data: text("step2_data"), // JSON string
  status: lessonPlanStatusEnum("status").default("DRAFT").notNull(),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewerRemark: text("reviewer_remark"),
  principalRemark: text("principal_remark"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonPlansRelations = relations(lessonPlans, ({ one }) => ({
  teacherUser: one(users, {
    fields: [lessonPlans.teacherId],
    references: [users.id],
  }),
  teacherProfile: one(teachers, {
    fields: [lessonPlans.teacherId],
    references: [teachers.userId],
  }),
  reviewerUser: one(users, {
    fields: [lessonPlans.reviewerId],
    references: [users.id],
  }),
  reviewerProfile: one(teachers, {
    fields: [lessonPlans.reviewerId],
    references: [teachers.userId],
  }),
  class: one(classes, {
    fields: [lessonPlans.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [lessonPlans.subjectId],
    references: [subjects.id],
  }),
  chapterDivision: one(chapterDivisions, {
    fields: [lessonPlans.chapterDivisionId],
    references: [chapterDivisions.id],
  }),
}));

export const homeworkSubmissions = pgTable("homework_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonPlanId: uuid("lesson_plan_id").notNull().references(() => lessonPlans.id, { onDelete: 'cascade' }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  description: text("description"),
  imagePath: text("image_path"),
  status: homeworkSubmissionStatusEnum("status").default("PENDING").notNull(),
  feedback: text("feedback"),
  rating: integer("rating"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
});





export const homeVisits = pgTable("home_visits", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  visitDate: text("visit_date"),
  visitTime: text("visit_time"),
  teacherName: text("teacher_name"),
  remarks: text("remarks"),
  adminRemarks: text("admin_remarks"),
  visitImage: text("visit_image"),
  homePhoto: text("home_photo"),
  status: testStatusEnum("status").default("NOT_SCHEDULED").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Relations ---

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  admissionMeta: one(admissionMeta),
}));

export const admissionMetaRelations = relations(admissionMeta, ({ one, many }) => ({
  inquiry: one(inquiries, {
    fields: [admissionMeta.inquiryId],
    references: [inquiries.id],
  }),
  studentProfile: one(studentProfiles),
  studentBio: one(studentBio),
  documentChecklists: one(documentChecklists),
  studentDocuments: one(studentDocuments),
  entranceTest: one(entranceTests),
  homeVisit: one(homeVisits),
  scholarshipAttendance: many(scholarshipAttendance),
  scholarshipHomework: many(scholarshipHomework),
  scholarshipGuardian: many(scholarshipGuardian),
  scholarshipPtm: many(scholarshipPtm),
  scholarshipRecords: many(scholarshipRecords),
  academyStudent: one(students, {
    fields: [admissionMeta.entryNumber],
    references: [students.studentId],
  }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
  }),
  admissionMeta: one(admissionMeta, {
    fields: [studentProfiles.admissionMetaId],
    references: [admissionMeta.id],
  }),
}));

export const homeVisitsRelations = relations(homeVisits, ({ one }) => ({
  admissionMeta: one(admissionMeta, {
    fields: [homeVisits.admissionId],
    references: [admissionMeta.id],
  }),
}));

export const studentBioRelations = relations(studentBio, ({ one }) => ({
  admissionMeta: one(admissionMeta, {
    fields: [studentBio.admissionId],
    references: [admissionMeta.id],
  }),
}));

export const documentChecklistsRelations = relations(documentChecklists, ({ one }) => ({
  admissionMeta: one(admissionMeta, {
    fields: [documentChecklists.admissionId],
    references: [admissionMeta.id],
  }),
}));

export const studentDocumentsRelations = relations(studentDocuments, ({ one }) => ({
  admissionMeta: one(admissionMeta, {
    fields: [studentDocuments.admissionId],
    references: [admissionMeta.id],
  }),
}));

export const entranceTestsRelations = relations(entranceTests, ({ one }) => ({
  admissionMeta: one(admissionMeta, {
    fields: [entranceTests.admissionId],
    references: [admissionMeta.id],
  }),
}));

export const scholarshipAttendanceRelations = relations(scholarshipAttendance, ({ one }) => ({
  admissionMeta: one(admissionMeta, { fields: [scholarshipAttendance.admissionId], references: [admissionMeta.id] }),
}));

export const scholarshipHomeworkRelations = relations(scholarshipHomework, ({ one }) => ({
  admissionMeta: one(admissionMeta, { fields: [scholarshipHomework.admissionId], references: [admissionMeta.id] }),
}));

export const scholarshipGuardianRelations = relations(scholarshipGuardian, ({ one }) => ({
  admissionMeta: one(admissionMeta, { fields: [scholarshipGuardian.admissionId], references: [admissionMeta.id] }),
}));

export const scholarshipPtmRelations = relations(scholarshipPtm, ({ one }) => ({
  admissionMeta: one(admissionMeta, { fields: [scholarshipPtm.admissionId], references: [admissionMeta.id] }),
}));

export const scholarshipRecordsRelations = relations(scholarshipRecords, ({ one }) => ({
  admissionMeta: one(admissionMeta, { fields: [scholarshipRecords.admissionId], references: [admissionMeta.id] }),
}));

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "INCIDENT" | "COMPLAIN" | "FEEDBACK"
  note: text("note").notNull(),
  category: text("category").default("General").notNull(),
  priority: text("priority").default("Medium").notNull(),
  status: text("status").default("Open").notNull(),
  classId: integer("class_id").references(() => classes.id, { onDelete: 'set null' }),
  studentId: integer("student_id").references(() => students.id, { onDelete: 'set null' }),
  teacherId: uuid("teacher_id").references(() => teachers.id, { onDelete: 'set null' }), // Tagged teacher
  studentIds: text("student_ids"), // JSON stringified array of student IDs
  teacherIds: text("teacher_ids"), // JSON stringified array of teacher IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const incidentsRelations = relations(incidents, ({ one }) => ({
  class: one(classes, { fields: [incidents.classId], references: [classes.id] }),
  student: one(students, { fields: [incidents.studentId], references: [students.id] }),
  teacher: one(teachers, { fields: [incidents.teacherId], references: [teachers.id] }),
}));

export const studentLeaves = pgTable("student_leaves", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: text("type").notNull(), // 'HALF_DAY', 'FULL_DAY'
  reason: text("reason").notNull(),
  imageUrl: text("image_url"), // Optional S3 image upload URL
  status: text("status").default("PENDING").notNull(), // 'PENDING', 'APPROVED', 'REJECTED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studentLeavesRelations = relations(studentLeaves, ({ one }) => ({
  student: one(students, { fields: [studentLeaves.studentId], references: [students.id] }),
  class: one(classes, { fields: [studentLeaves.classId], references: [classes.id] }),
}));

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'BOOK', 'DEVICE', 'EQUIPMENT', 'OTHER'
  totalQuantity: integer("total_quantity").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  cost: doublePrecision("cost").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resourceIssuances = pgTable("resource_issuances", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  recipientType: text("recipient_type").notNull(), // 'STUDENT', 'TEACHER'
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").references(() => teachers.id, { onDelete: "cascade" }),
  quantityIssued: integer("quantity_issued").notNull(),
  status: text("status").default("ISSUED").notNull(), // 'ISSUED', 'RETURNED'
  returnComment: text("return_comment"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  returnedAt: timestamp("returned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resourcesRelations = relations(resources, ({ many }) => ({
  issuances: many(resourceIssuances),
}));

export const resourceIssuancesRelations = relations(resourceIssuances, ({ one }) => ({
  resource: one(resources, { fields: [resourceIssuances.resourceId], references: [resources.id] }),
  student: one(students, { fields: [resourceIssuances.studentId], references: [students.id] }),
  teacher: one(teachers, { fields: [resourceIssuances.teacherId], references: [teachers.id] }),
}));

export const sidebarPermissions = pgTable("sidebar_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissions: text("permissions").notNull(), // JSON string storing enabled/disabled items/sections
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: uniqueIndex("sidebar_user_id_idx").on(table.userId),
  };
});

export const timetable = pgTable("timetable", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayOfWeek: text("day_of_week").notNull(), // e.g. "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  classId: integer("class_id").references(() => classes.id, { onDelete: 'cascade' }),
  className: text("class_name").notNull(), // e.g. "Nursery", "KG I", "KG II", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"
  periodName: text("period_name").notNull(), // e.g. "Period 1st", "Period 2nd", "Period 3rd", "Period 4th", "LUNCH", "Period 5th", "Period 6th", "Period 7th", "Period 8th", "PRAYER", "School Is Out"
  startTime: text("start_time").notNull(), // e.g. "09:00", "09:40", "10:20", "11:00", "11:40", "12:00", "12:40", "13:20", "14:00", "14:30", "14:35"
  endTime: text("end_time").notNull(), // e.g. "09:40", "10:20", "11:00", "11:40", "12:00", "12:40", "13:20", "14:00", "14:30", "14:35", "14:45"
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: 'set null' }),
  customSubject: text("custom_subject"), // e.g. "Mother Teacher", "Maths", "LUNCH"
  teacherId: uuid("teacher_id").references(() => teachers.id, { onDelete: 'set null' }),
  customTeacher: text("custom_teacher"), // e.g. "Aiman Khan", "Yasmeen Mam", "Riya Soni"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timetableRelations = relations(timetable, ({ one }) => ({
  class: one(classes, {
    fields: [timetable.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [timetable.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [timetable.teacherId],
    references: [teachers.id],
  }),
}));

export const transportBuses = pgTable("transport_buses", {
  id: serial("id").primaryKey(),
  busName: text("bus_name").notNull(),
  timingMorning: text("timing_morning").notNull(),
  timingEvening: text("timing_evening").notNull(),
  capacity: integer("capacity").notNull().default(40),
  routes: text("routes").notNull(), // JSON string storing array of stops: [{"name":"stop","time":"time","lat":lat,"lng":lng}]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transportStudents = pgTable("transport_students", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  busId: integer("bus_id").notNull().references(() => transportBuses.id, { onDelete: 'cascade' }),
  routeStop: text("route_stop").notNull(),
  locationName: text("location_name"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transportBusesRelations = relations(transportBuses, ({ many }) => ({
  students: many(transportStudents),
}));

export const transportStudentsRelations = relations(transportStudents, ({ one }) => ({
  student: one(students, {
    fields: [transportStudents.studentId],
    references: [students.id],
  }),
  bus: one(transportBuses, {
    fields: [transportStudents.busId],
    references: [transportBuses.id],
  }),
}));

// --- Exam & Test Scheduling ---

export const examSchedules = pgTable("exam_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Exam type classification
  examType: text("exam_type").notNull(), // 'WEEKLY_TEST' | 'MONTHLY_TEST' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'UNIT_TEST' | 'PRACTICE_TEST'
  title: text("title").notNull(), // e.g. "Mathematics Weekly Test - June Week 1"
  description: text("description"),

  // Class & Subject
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }),
  className: text("class_name").notNull(), // denormalized for display
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  subjectName: text("subject_name"), // denormalized for display

  // Schedule
  examDate: text("exam_date").notNull(), // "YYYY-MM-DD"
  startTime: text("start_time").notNull(), // "HH:MM"
  endTime: text("end_time").notNull(),   // "HH:MM"
  durationMinutes: integer("duration_minutes"),

  // Timetable slot reference (optional - when linked from timetable)
  timetablePeriod: text("timetable_period"), // e.g. "Period 1st"

  // Exam details
  maxMarks: integer("max_marks").default(100),
  passingMarks: integer("passing_marks").default(35),
  venue: text("venue").default("Classroom"),
  instructions: text("instructions"),
  papers: text("papers"), // JSON string of papers

  // Status
  status: text("status").default("SCHEDULED").notNull(), // 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

  // Who created
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const examSchedulesRelations = relations(examSchedules, ({ one }) => ({
  class: one(classes, { fields: [examSchedules.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [examSchedules.subjectId], references: [subjects.id] }),
  creator: one(users, { fields: [examSchedules.createdBy], references: [users.id] }),
}));

export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // "YYYY-MM-DD"
  title: text("title").notNull(),
  type: text("type").default("FULL_DAY").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles),
  teacherProfile: one(teachers),
  examSchedulesCreated: many(examSchedules),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  students: many(students),
  subjects: many(subjects),
  timetable: many(timetable),
  examSchedules: many(examSchedules),
  incidents: many(incidents),
  studentLeaves: many(studentLeaves),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  attendance: many(studentAttendance),
  leaves: many(studentLeaves),
  resourceIssuances: many(resourceIssuances),
  incidents: many(incidents),
  transportStudents: many(transportStudents),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  subjects: many(subjects, { relationName: "assignedTeacher" }),
  reviewer1Subjects: many(subjects, { relationName: "reviewer1" }),
  reviewer2Subjects: many(subjects, { relationName: "reviewer2" }),
  timetable: many(timetable),
  incidents: many(incidents),
  resourceIssuances: many(resourceIssuances),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  class: one(classes, {
    fields: [subjects.classId],
    references: [classes.id],
  }),
  assignedTeacher: one(teachers, {
    fields: [subjects.assignedTeacherId],
    references: [teachers.id],
    relationName: "assignedTeacher",
  }),
  reviewer1: one(teachers, {
    fields: [subjects.reviewerId1],
    references: [teachers.id],
    relationName: "reviewer1",
  }),
  reviewer2: one(teachers, {
    fields: [subjects.reviewerId2],
    references: [teachers.id],
    relationName: "reviewer2",
  }),
  units: many(units),
  timetable: many(timetable),
  examSchedules: many(examSchedules),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [units.subjectId],
    references: [subjects.id],
  }),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  unit: one(units, {
    fields: [chapters.unitId],
    references: [units.id],
  }),
  divisions: many(chapterDivisions),
  pdfs: many(chapterPdfs),
}));

export const chapterDivisionsRelations = relations(chapterDivisions, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterDivisions.chapterId],
    references: [chapters.id],
  }),
}));

export const chapterPdfsRelations = relations(chapterPdfs, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterPdfs.chapterId],
    references: [chapters.id],
  }),
}));

export const studentAttendanceRelations = relations(studentAttendance, ({ one }) => ({
  student: one(students, {
    fields: [studentAttendance.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [studentAttendance.classId],
    references: [classes.id],
  }),
}));

// ── Committee Meetings ──────────────────────────────────────────────────────
// Each row = one scheduled meeting for a committee.
// attendeeIds is stored as a comma-separated list of teacher UUIDs.

export const committeeMeetings = pgTable("committee_meetings", {
  id: serial("id").primaryKey(),
  committeeName: text("committee_name").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),          // "YYYY-MM-DD"
  month: text("month"),                  // "January", "February", …
  time: text("time"),                    // "HH:MM"
  venue: text("venue"),
  attendeeIds: text("attendee_ids"),     // comma-separated teacher UUIDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Dynamic Committee Roles ──────────────────────────────────────────────────
export const committeeRoles = pgTable("committee_roles", {
  id: serial("id").primaryKey(),
  roleName: text("role_name").notNull(),
  canApproveAcademy: boolean("can_approve_academy").default(false).notNull(),
  canManageTimetable: boolean("can_manage_timetable").default(false).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Committee Members ────────────────────────────────────────────────────────
export const committeeMembers = pgTable("committee_members", {
  id: serial("id").primaryKey(),
  teacherId: uuid("teacher_id").references(() => teachers.id, { onDelete: "cascade" }).notNull(),
  committeeName: text("committee_name").notNull(),
  roleId: integer("role_id").references(() => committeeRoles.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const committeeRoleRelations = relations(committeeRoles, ({ many }) => ({
  members: many(committeeMembers),
}));

export const committeeMemberRelations = relations(committeeMembers, ({ one }) => ({
  teacher: one(teachers, {
    fields: [committeeMembers.teacherId],
    references: [teachers.id],
  }),
  role: one(committeeRoles, {
    fields: [committeeMembers.roleId],
    references: [committeeRoles.id],
  }),
}));

