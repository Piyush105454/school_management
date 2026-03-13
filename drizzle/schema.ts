import { pgTable, foreignKey, unique, uuid, text, timestamp, boolean, doublePrecision, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const admissionType = pgEnum("admission_type", ['NEW', 'RE_ADMISSION'])
export const caste = pgEnum("caste", ['GEN', 'OBC', 'ST', 'SC'])
export const documentStatus = pgEnum("document_status", ['SUBMITTED', 'NOT_SUBMITTED'])
export const gender = pgEnum("gender", ['M', 'F', 'O'])
export const inquiryStatus = pgEnum("inquiry_status", ['PENDING', 'SHORTLISTED', 'REJECTED'])
export const role = pgEnum("role", ['OFFICE', 'STUDENT_PARENT'])
export const testStatus = pgEnum("test_status", ['NOT_SCHEDULED', 'PENDING', 'PASS', 'FAIL'])


export const studentDocuments = pgTable("student_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	birthCertificate: text("birth_certificate"),
	studentPhoto: text("student_photo"),
	marksheet: text(),
	casteCertificate: text("caste_certificate"),
	affidavit: text(),
	transferCertificate: text("transfer_certificate"),
	scholarshipSlip: text("scholarship_slip"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "student_documents_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("student_documents_admission_id_unique").on(table.admissionId),
]);

export const entranceTests = pgTable("entrance_tests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	testDate: text("test_date"),
	testTime: text("test_time"),
	location: text(),
	teacherName: text("teacher_name"),
	contactNumber: text("contact_number"),
	status: testStatus().default('NOT_SCHEDULED').notNull(),
	resultDate: timestamp("result_date", { mode: 'string' }),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "entrance_tests_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("entrance_tests_admission_id_unique").on(table.admissionId),
]);

export const declarations = pgTable("declarations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	declarationAccepted: boolean("declaration_accepted").default(false).notNull(),
	guardianName: text("guardian_name").notNull(),
	signatureFile: text("signature_file"),
	declarationDate: timestamp("declaration_date", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "declarations_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("declarations_admission_id_unique").on(table.admissionId),
]);

export const documentChecklists = pgTable("document_checklists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	birthCertificate: documentStatus("birth_certificate").default('NOT_SUBMITTED').notNull(),
	previousMarksheet: documentStatus("previous_marksheet").default('NOT_SUBMITTED').notNull(),
	studentPhotos3: documentStatus("student_photos_3").default('NOT_SUBMITTED').notNull(),
	casteCertificate: documentStatus("caste_certificate").default('NOT_SUBMITTED').notNull(),
	parentAffidavit: documentStatus("parent_affidavit").default('NOT_SUBMITTED').notNull(),
	scholarshipLetter: documentStatus("scholarship_letter").default('NOT_SUBMITTED').notNull(),
	transferCertificate: documentStatus("transfer_certificate").default('NOT_SUBMITTED').notNull(),
	formReceivedComplete: boolean("form_received_complete").default(false).notNull(),
	receivedByName: text("received_by_name"),
	principalSignDate: timestamp("principal_sign_date", { mode: 'string' }),
	anyOtherDetails: text("any_other_details"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "document_checklists_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("document_checklists_admission_id_unique").on(table.admissionId),
]);

export const parentGuardianDetails = pgTable("parent_guardian_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	personType: text("person_type").notNull(),
	isSingleParent: boolean("is_single_parent").default(false).notNull(),
	legalGuardianType: text("legal_guardian_type"),
	name: text().notNull(),
	mobileNumber: text("mobile_number").notNull(),
	occupation: text(),
	qualification: text(),
	aadhaarNumber: text("aadhaar_number"),
	samagraNumber: text("samagra_number"),
	relation: text(),
	officeShopName: text("office_shop_name"),
	jobDetails: text("job_details"),
	photo: text(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "parent_guardian_details_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
]);

export const previousAcademic = pgTable("previous_academic", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	schoolName: text("school_name").notNull(),
	schoolType: text("school_type").notNull(),
	apaarId: text("apaar_id"),
	penNumber: text("pen_number"),
	classLastAttended: text("class_last_attended"),
	sessionYear: text("session_year"),
	marksObtained: doublePrecision("marks_obtained"),
	totalMarks: doublePrecision("total_marks"),
	percentage: doublePrecision(),
	passFail: text("pass_fail"),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "previous_academic_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("previous_academic_admission_id_unique").on(table.admissionId),
]);

export const siblingDetails = pgTable("sibling_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	siblingNumber: integer("sibling_number").notNull(),
	name: text().notNull(),
	age: integer(),
	gender: gender(),
	classCurrent: text("class_current"),
	schoolName: text("school_name"),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "sibling_details_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
]);

export const studentAddress = pgTable("student_address", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	houseNo: text("house_no").notNull(),
	wardNo: text("ward_no"),
	street: text().notNull(),
	village: text().notNull(),
	tehsil: text(),
	district: text(),
	state: text(),
	pinCode: text("pin_code"),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "student_address_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("student_address_admission_id_unique").on(table.admissionId),
]);

export const studentBankDetails = pgTable("student_bank_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	bankName: text("bank_name"),
	accountHolderName: text("account_holder_name"),
	accountNumber: text("account_number"),
	ifscCode: text("ifsc_code"),
	note: text(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "student_bank_details_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("student_bank_details_admission_id_unique").on(table.admissionId),
]);

export const inquiries = pgTable("inquiries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentName: text("student_name").notNull(),
	parentName: text("parent_name").notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	appliedClass: text("applied_class").notNull(),
	academicYear: text("academic_year").notNull(),
	status: inquiryStatus().default('PENDING').notNull(),
	entryNumber: text("entry_number"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("inquiries_entry_number_unique").on(table.entryNumber),
]);

export const admissionMeta = pgTable("admission_meta", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	inquiryId: uuid("inquiry_id").notNull(),
	academicYear: text("academic_year").notNull(),
	admissionType: admissionType("admission_type").default('NEW').notNull(),
	previouslyAppliedYear: text("previously_applied_year"),
	entryNumber: text("entry_number").notNull(),
	admissionNumber: text("admission_number"),
	scholarNumber: text("scholar_number"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.inquiryId],
			foreignColumns: [inquiries.id],
			name: "admission_meta_inquiry_id_inquiries_id_fk"
		}).onDelete("cascade"),
	unique("admission_meta_inquiry_id_unique").on(table.inquiryId),
	unique("admission_meta_entry_number_unique").on(table.entryNumber),
	unique("admission_meta_admission_number_unique").on(table.admissionNumber),
	unique("admission_meta_scholar_number_unique").on(table.scholarNumber),
]);

export const studentBio = pgTable("student_bio", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),
	gender: gender().notNull(),
	dob: timestamp({ mode: 'string' }).notNull(),
	age: integer().notNull(),
	religion: text(),
	caste: caste().notNull(),
	familyId: text("family_id"),
	bloodGroup: text("blood_group"),
	heightCm: doublePrecision("height_cm"),
	weightKg: doublePrecision("weight_kg"),
	aadhaarNumber: text("aadhaar_number"),
	samagraId: text("samagra_id"),
	cwsn: boolean().default(false).notNull(),
	cwsnProblemDesc: text("cwsn_problem_desc"),
	studentPhoto: text("student_photo"),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "student_bio_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("student_bio_admission_id_unique").on(table.admissionId),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	role: role().default('OFFICE').notNull(),
	phone: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const studentProfiles = pgTable("student_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	admissionMetaId: uuid("admission_meta_id"),
	admissionStep: integer("admission_step").default(1).notNull(),
	isFullyAdmitted: boolean("is_fully_admitted").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "student_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.admissionMetaId],
			foreignColumns: [admissionMeta.id],
			name: "student_profiles_admission_meta_id_admission_meta_id_fk"
		}),
	unique("student_profiles_user_id_unique").on(table.userId),
]);
