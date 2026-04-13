import { pgTable, text, serial, timestamp, boolean, integer, doublePrecision, pgEnum, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["OFFICE", "STUDENT_PARENT", "TEACHER"]);
export const inquiryStatusEnum = pgEnum("inquiry_status", ["PENDING", "SHORTLISTED", "REJECTED"]);
export const admissionTypeEnum = pgEnum("admission_type", ["NEW", "RE_ADMISSION"]);
export const genderEnum = pgEnum("gender", ["M", "F", "O"]);
export const casteEnum = pgEnum("caste", ["GEN", "OBC", "ST", "SC"]);
export const documentStatusEnum = pgEnum("document_status", ["SUBMITTED", "NOT_SUBMITTED", "VERIFIED", "REJECTED"]);
export const testStatusEnum = pgEnum("test_status", ["NOT_SCHEDULED", "PENDING", "PASS", "FAIL"]);

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
  phone: text("phone").notNull().unique(),
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
  appliedScholarship: boolean("applied_scholarship").default(false).notNull(),
  awardedScholarship: boolean("awarded_scholarship").default(false).notNull(),
  scholarshipAmount: integer("scholarship_amount").default(0).notNull(),
  officeRemarks: text("office_remarks"),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scholarshipPtm = pgTable("scholarship_ptm", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }),
  month: text("month").notNull(),
  year: text("year").notNull(),
  attended: boolean("attended").default(false).notNull(),
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

  status: scholarshipStatusEnum("status").default("PENDING").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  admissionMeta: one(admissionMeta, {
    fields: [inquiries.id],
    references: [admissionMeta.inquiryId],
  }),
}));

export const admissionMetaRelations = relations(admissionMeta, ({ one, many }) => ({
  inquiry: one(inquiries, {
    fields: [admissionMeta.inquiryId],
    references: [inquiries.id],
  }),
  studentProfile: one(studentProfiles, {
    fields: [admissionMeta.id],
    references: [studentProfiles.admissionMetaId],
  }),
  studentBio: one(studentBio, {
    fields: [admissionMeta.id],
    references: [studentBio.admissionId],
  }),
  documentChecklists: one(documentChecklists, {
    fields: [admissionMeta.id],
    references: [documentChecklists.admissionId],
  }),
  studentDocuments: one(studentDocuments, {
    fields: [admissionMeta.id],
    references: [studentDocuments.admissionId],
  }),
  entranceTest: one(entranceTests, {
    fields: [admissionMeta.id],
    references: [entranceTests.admissionId],
  }),
  homeVisit: one(homeVisits, {
    fields: [admissionMeta.id],
    references: [homeVisits.admissionId],
  }),
  scholarshipAttendance: many(scholarshipAttendance),
  scholarshipHomework: many(scholarshipHomework),
  scholarshipGuardian: many(scholarshipGuardian),
  scholarshipPtm: many(scholarshipPtm),
  scholarshipRecords: many(scholarshipRecords),
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

export const homeVisits = pgTable("home_visits", {
  id: uuid("id").defaultRandom().primaryKey(),
  admissionId: uuid("admission_id").notNull().references(() => admissionMeta.id, { onDelete: 'cascade' }).unique(),
  visitDate: text("visit_date"),
  visitTime: text("visit_time"),
  teacherName: text("teacher_name"),
  remarks: text("remarks"),
  visitImage: text("visit_image"),
  homePhoto: text("home_photo"),
  status: testStatusEnum("status").default("NOT_SCHEDULED").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const homeVisitsRelations = relations(homeVisits, ({ one }) => ({
  admissionMeta: one(admissionMeta, {
    fields: [homeVisits.admissionId],
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

// --- Academy Management ---

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: integer("grade").notNull().default(0),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id),
  studentId: text("student_id").unique().notNull(),
  name: text("name").notNull(),
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
});

export const studentAttendance = pgTable("student_attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  classId: integer("class_id").references(() => classes.id),
  date: timestamp("date").notNull(),
  day: text("day"),
  month: text("month"),
  year: integer("year"),
  status: text("status", { enum: ["P", "A"] }),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  medium: text("medium").default("English/Hindi").notNull(),
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

// Academy Relations
export const classesRelations = relations(classes, ({ many }) => ({
  subjects: many(subjects),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  class: one(classes, { fields: [subjects.classId], references: [classes.id] }),
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  subject: one(subjects, { fields: [units.subjectId], references: [subjects.id] }),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  unit: one(units, { fields: [chapters.unitId], references: [units.id] }),
  chapterPdfs: many(chapterPdfs),
}));

export const chapterPdfsRelations = relations(chapterPdfs, ({ one }) => ({
  chapter: one(chapters, { fields: [chapterPdfs.chapterId], references: [chapters.id] }),
}));

