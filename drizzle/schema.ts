import { pgTable, foreignKey, serial, integer, text, unique, uuid, boolean, timestamp, doublePrecision, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const admissionType = pgEnum("admission_type", ['NEW', 'RE_ADMISSION'])
export const caste = pgEnum("caste", ['GEN', 'OBC', 'ST', 'SC'])
export const documentStatus = pgEnum("document_status", ['SUBMITTED', 'NOT_SUBMITTED', 'VERIFIED', 'REJECTED'])
export const gender = pgEnum("gender", ['M', 'F', 'O'])
export const homeworkSubmissionStatus = pgEnum("homework_submission_status", ['PENDING', 'COMPLETED', 'REJECTED'])
export const inquiryStatus = pgEnum("inquiry_status", ['PENDING', 'SHORTLISTED', 'REJECTED'])
export const lessonPlanStatus = pgEnum("lesson_plan_status", ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'])
export const role = pgEnum("role", ['OFFICE', 'STUDENT_PARENT', 'TEACHER', 'PRINCIPAL', 'ADMIN'])
export const scholarshipStatus = pgEnum("scholarship_status", ['PENDING', 'APPROVED', 'PAID'])
export const testStatus = pgEnum("test_status", ['NOT_SCHEDULED', 'PENDING', 'PASS', 'FAIL'])


export const chapters = pgTable("chapters", {
	id: serial().primaryKey().notNull(),
	unitId: integer("unit_id").notNull(),
	name: text().notNull(),
	chapterNo: integer("chapter_no").notNull(),
	pageStart: integer("page_start").notNull(),
	pageEnd: integer("page_end").notNull(),
	orderNo: integer("order_no").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "chapters_unit_id_units_id_fk"
		}).onDelete("cascade"),
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

export const chapterPdfs = pgTable("chapter_pdfs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chapterId: integer("chapter_id").notNull(),
	fileUrl: text("file_url").notNull(),
	uploadedBy: text("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "chapter_pdfs_chapter_id_chapters_id_fk"
		}).onDelete("cascade"),
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
	marksObtained: doublePrecision("marks_obtained"),
	graceMarks: doublePrecision("grace_marks"),
	totalMarks: doublePrecision("total_marks"),
	reportLink: text("report_link"),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	adminRemarks: text("admin_remarks"),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "entrance_tests_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("entrance_tests_admission_id_unique").on(table.admissionId),
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

export const classes = pgTable("classes", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	grade: integer().default(0).notNull(),
	institute: text(),
});

export const admissionMeta = pgTable("admission_meta", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	inquiryId: uuid("inquiry_id").notNull(),
	academicYear: text("academic_year").notNull(),
	admissionType: admissionType("admission_type").default('NEW').notNull(),
	previouslyAppliedYear: text("previously_applied_year"),
	entryNumber: text("entry_number").notNull(),
	admissionNumber: text("admission_number"),
	scholarNumber: text("scholar_number"),
	appliedScholarship: boolean("applied_scholarship"),
	awardedScholarship: boolean("awarded_scholarship").default(false).notNull(),
	scholarshipAmount: integer("scholarship_amount").default(0).notNull(),
	officeRemarks: text("office_remarks"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	documentRemarks: text("document_remarks"),
	verificationRemarks: text("verification_remarks"),
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

export const lessonPlans = pgTable("lesson_plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teacherId: uuid("teacher_id"),
	classId: integer("class_id"),
	subjectId: integer("subject_id"),
	date: text().notNull(),
	type: text().default('EXPLANATION').notNull(),
	step1Data: text("step1_data"),
	step2Data: text("step2_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	status: lessonPlanStatus().default('DRAFT').notNull(),
	reviewerId: uuid("reviewer_id"),
	reviewerRemark: text("reviewer_remark"),
}, (table) => [
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [users.id],
			name: "lesson_plans_teacher_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "lesson_plans_class_id_classes_id_fk"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "lesson_plans_subject_id_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.reviewerId],
			foreignColumns: [users.id],
			name: "lesson_plans_reviewer_id_users_id_fk"
		}),
]);

export const homeVisits = pgTable("home_visits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	visitDate: text("visit_date"),
	visitTime: text("visit_time"),
	teacherName: text("teacher_name"),
	remarks: text(),
	visitImage: text("visit_image"),
	homePhoto: text("home_photo"),
	status: testStatus().default('NOT_SCHEDULED').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	adminRemarks: text("admin_remarks"),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "home_visits_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
	unique("home_visits_admission_id_unique").on(table.admissionId),
]);

export const overallAttendance = pgTable("overall_attendance", {
	id: serial().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	day: text(),
	month: text(),
	year: integer(),
	total: integer(),
	present: integer(),
	absent: integer(),
	attendancePct: integer("attendance_pct"),
}, (table) => [
	index("overall_date_idx").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("overall_month_year_idx").using("btree", table.month.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops")),
]);

export const scholarshipAttendance = pgTable("scholarship_attendance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	month: text().notNull(),
	year: text().notNull(),
	totalDays: integer("total_days").notNull(),
	presentDays: integer("present_days").notNull(),
	percentage: doublePrecision().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "scholarship_attendance_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
]);

export const scholarshipCriteriaSettings = pgTable("scholarship_criteria_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	academicYear: text("academic_year").notNull(),
	admissionId: uuid("admission_id"),
	attendanceThreshold: integer("attendance_threshold").default(90).notNull(),
	attendanceAmount: integer("attendance_amount").default(750).notNull(),
	homeworkThreshold: integer("homework_threshold").default(90).notNull(),
	homeworkAmount: integer("homework_amount").default(750).notNull(),
	guardianRatingThreshold: integer("guardian_rating_threshold").default(8).notNull(),
	guardianAmount: integer("guardian_amount").default(750).notNull(),
	ptmAmount: integer("ptm_amount").default(750).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("academic_year_admission_idx").using("btree", table.academicYear.asc().nullsLast().op("text_ops"), table.admissionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "scholarship_criteria_settings_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
]);

export const scholarshipHomework = pgTable("scholarship_homework", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	month: text().notNull(),
	year: text().notNull(),
	totalGiven: integer("total_given").notNull(),
	totalDone: integer("total_done").notNull(),
	percentage: doublePrecision().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "scholarship_homework_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
]);

export const scholarshipGuardian = pgTable("scholarship_guardian", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	month: text().notNull(),
	year: text().notNull(),
	rating: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	comments: text(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "scholarship_guardian_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
]);

export const scholarshipRecords = pgTable("scholarship_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	month: text().notNull(),
	year: text().notNull(),
	attendanceAmount: integer("attendance_amount").notNull(),
	homeworkAmount: integer("homework_amount").notNull(),
	guardianAmount: integer("guardian_amount").notNull(),
	ptmAmount: integer("ptm_amount").notNull(),
	totalAmount: integer("total_amount").notNull(),
	status: scholarshipStatus().default('PENDING').notNull(),
	approvedBy: text("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	adjustmentAmount: integer("adjustment_amount").default(0).notNull(),
	adjustmentNote: text("adjustment_note"),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "scholarship_records_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
]);

export const scholarshipPtm = pgTable("scholarship_ptm", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	admissionId: uuid("admission_id").notNull(),
	month: text().notNull(),
	year: text().notNull(),
	attended: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	parentImages: text("parent_images"),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissionMeta.id],
			name: "scholarship_ptm_admission_id_admission_meta_id_fk"
		}).onDelete("cascade"),
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

export const studentAttendance = pgTable("student_attendance", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id"),
	classId: integer("class_id"),
	date: timestamp({ mode: 'string' }).notNull(),
	day: text(),
	month: text(),
	year: integer(),
	status: text(),
}, (table) => [
	index("student_attendance_date_idx").using("btree", table.studentId.asc().nullsLast().op("int4_ops"), table.date.asc().nullsLast().op("int4_ops")),
	index("student_attendance_month_year_idx").using("btree", table.month.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_attendance_student_id_students_id_fk"
		}),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "student_attendance_class_id_classes_id_fk"
		}),
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

export const teachers = pgTable("teachers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	name: text().notNull(),
	contactNumber: text("contact_number"),
	institute: text(),
	responsibility: text(),
	incharge: text(),
	specialization: text(),
	assignedRole: text("assigned_role"),
	classAssigned: text("class_assigned"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	committees: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "teachers_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const students = pgTable("students", {
	id: serial().primaryKey().notNull(),
	classId: integer("class_id"),
	studentId: text("student_id").notNull(),
	name: text().notNull(),
	rollNumber: text("roll_number"),
	scholarNumber: text("scholar_number"),
	faceEmbedding: text("face_embedding"),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "students_class_id_classes_id_fk"
		}),
	unique("students_student_id_unique").on(table.studentId),
]);

export const subjects = pgTable("subjects", {
	id: serial().primaryKey().notNull(),
	classId: integer("class_id").notNull(),
	name: text().notNull(),
	bookName: text("book_name"),
	medium: text().default('English/Hindi').notNull(),
	assignedTeacherId: uuid("assigned_teacher_id"),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "subjects_class_id_classes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedTeacherId],
			foreignColumns: [teachers.id],
			name: "subjects_assigned_teacher_id_teachers_id_fk"
		}).onDelete("set null"),
]);

export const inquiries = pgTable("inquiries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	studentName: text("student_name"),
	parentName: text("parent_name").notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	appliedClass: text("applied_class").notNull(),
	school: text(),
	academicYear: text("academic_year").notNull(),
	status: inquiryStatus().default('PENDING').notNull(),
	entryNumber: text("entry_number"),
	aadhaarNumber: text("aadhaar_number"),
	passwordPlain: text("password_plain"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("inquiries_email_unique").on(table.email),
	unique("inquiries_entry_number_unique").on(table.entryNumber),
	unique("inquiries_aadhaar_number_unique").on(table.aadhaarNumber),
]);

export const chapterDivisions = pgTable("chapter_divisions", {
	id: serial().primaryKey().notNull(),
	chapterId: integer("chapter_id").notNull(),
	pageStart: integer("page_start").notNull(),
	pageEnd: integer("page_end").notNull(),
	orderNo: integer("order_no").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "chapter_divisions_chapter_id_chapters_id_fk"
		}).onDelete("cascade"),
]);

export const units = pgTable("units", {
	id: serial().primaryKey().notNull(),
	subjectId: integer("subject_id").notNull(),
	name: text().notNull(),
	orderNo: integer("order_no").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "units_subject_id_subjects_id_fk"
		}).onDelete("cascade"),
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

export const homeworkSubmissions = pgTable("homework_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	lessonPlanId: uuid("lesson_plan_id").notNull(),
	studentId: integer("student_id").notNull(),
	description: text(),
	imagePath: text("image_path"),
	status: homeworkSubmissionStatus().default('PENDING').notNull(),
	feedback: text(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewedBy: uuid("reviewed_by"),
	rating: integer(),
}, (table) => [
	foreignKey({
			columns: [table.lessonPlanId],
			foreignColumns: [lessonPlans.id],
			name: "homework_submissions_lesson_plan_id_lesson_plans_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "homework_submissions_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "homework_submissions_reviewed_by_users_id_fk"
		}),
]);

export const incidents = pgTable("incidents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	type: text().notNull(),
	note: text().notNull(),
	category: text().default('General').notNull(),
	priority: text().default('Medium').notNull(),
	status: text().default('Open').notNull(),
	classId: integer("class_id"),
	studentId: integer("student_id"),
	teacherId: uuid("teacher_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	studentIds: text("student_ids"),
	teacherIds: text("teacher_ids"),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "incidents_class_id_classes_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "incidents_student_id_students_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [teachers.id],
			name: "incidents_teacher_id_teachers_id_fk"
		}).onDelete("set null"),
]);

export const studentLeaves = pgTable("student_leaves", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id").notNull(),
	classId: integer("class_id").notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	type: text().notNull(),
	reason: text().notNull(),
	imageUrl: text("image_url"),
	status: text().default('PENDING').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_leaves_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "student_leaves_class_id_classes_id_fk"
		}).onDelete("cascade"),
]);

export const resourceIssuances = pgTable("resource_issuances", {
	id: serial().primaryKey().notNull(),
	resourceId: integer("resource_id").notNull(),
	recipientType: text("recipient_type").notNull(),
	studentId: integer("student_id"),
	teacherId: uuid("teacher_id"),
	quantityIssued: integer("quantity_issued").notNull(),
	status: text().default('ISSUED').notNull(),
	issuedAt: timestamp("issued_at", { mode: 'string' }).defaultNow().notNull(),
	returnedAt: timestamp("returned_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	returnComment: text("return_comment"),
}, (table) => [
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "resource_issuances_resource_id_resources_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "resource_issuances_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [teachers.id],
			name: "resource_issuances_teacher_id_teachers_id_fk"
		}).onDelete("cascade"),
]);

export const examSchedules = pgTable("exam_schedules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	examType: text("exam_type").notNull(),
	title: text().notNull(),
	description: text(),
	classId: integer("class_id"),
	className: text("class_name").notNull(),
	subjectId: integer("subject_id"),
	subjectName: text("subject_name"),
	examDate: text("exam_date").notNull(),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	durationMinutes: integer("duration_minutes"),
	timetablePeriod: text("timetable_period"),
	maxMarks: integer("max_marks").default(100),
	passingMarks: integer("passing_marks").default(35),
	venue: text().default('Classroom'),
	instructions: text(),
	status: text().default('SCHEDULED').notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	papers: text(),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "exam_schedules_class_id_classes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "exam_schedules_subject_id_subjects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "exam_schedules_created_by_users_id_fk"
		}).onDelete("set null"),
]);

export const resources = pgTable("resources", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	totalQuantity: integer("total_quantity").notNull(),
	availableQuantity: integer("available_quantity").notNull(),
	cost: doublePrecision().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const sidebarPermissions = pgTable("sidebar_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	permissions: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("sidebar_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sidebar_permissions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const timetable = pgTable("timetable", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dayOfWeek: text("day_of_week").notNull(),
	classId: integer("class_id"),
	className: text("class_name").notNull(),
	periodName: text("period_name").notNull(),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	subjectId: integer("subject_id"),
	customSubject: text("custom_subject"),
	teacherId: uuid("teacher_id"),
	customTeacher: text("custom_teacher"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "timetable_class_id_classes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "timetable_subject_id_subjects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.teacherId],
			foreignColumns: [teachers.id],
			name: "timetable_teacher_id_teachers_id_fk"
		}).onDelete("set null"),
]);

export const transportStudents = pgTable("transport_students", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id").notNull(),
	busId: integer("bus_id").notNull(),
	routeStop: text("route_stop").notNull(),
	locationName: text("location_name"),
	latitude: doublePrecision(),
	longitude: doublePrecision(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "transport_students_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.busId],
			foreignColumns: [transportBuses.id],
			name: "transport_students_bus_id_transport_buses_id_fk"
		}).onDelete("cascade"),
]);

export const transportBuses = pgTable("transport_buses", {
	id: serial().primaryKey().notNull(),
	busName: text("bus_name").notNull(),
	timingMorning: text("timing_morning").notNull(),
	timingEvening: text("timing_evening").notNull(),
	capacity: integer().default(40).notNull(),
	routes: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const holidays = pgTable("holidays", {
	id: serial().primaryKey().notNull(),
	date: text().notNull(),
	title: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	type: text().default('FULL_DAY').notNull(),
	startTime: text("start_time"),
	endTime: text("end_time"),
}, (table) => [
	unique("holidays_date_unique").on(table.date),
]);
