import { pgTable, text, serial, timestamp, boolean, integer, doublePrecision, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["OFFICE", "STUDENT_PARENT"]);
export const inquiryStatusEnum = pgEnum("inquiry_status", ["PENDING", "SHORTLISTED", "REJECTED"]);
export const admissionTypeEnum = pgEnum("admission_type", ["NEW", "RE_ADMISSION"]);
export const genderEnum = pgEnum("gender", ["M", "F", "O"]);
export const casteEnum = pgEnum("caste", ["GEN", "OBC", "ST", "SC"]);
export const documentStatusEnum = pgEnum("document_status", ["SUBMITTED", "NOT_SUBMITTED"]);

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
  studentName: text("student_name").notNull(),
  parentName: text("parent_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  appliedClass: text("applied_class").notNull(),
  academicYear: text("academic_year").notNull(),
  status: inquiryStatusEnum("status").default("PENDING").notNull(),
  entryNumber: text("entry_number").unique(),
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
