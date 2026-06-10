import { relations } from "drizzle-orm/relations";
import { units, chapters, admissionMeta, declarations, chapterPdfs, entranceTests, documentChecklists, inquiries, users, lessonPlans, classes, subjects, homeVisits, scholarshipAttendance, scholarshipCriteriaSettings, scholarshipHomework, scholarshipGuardian, scholarshipRecords, scholarshipPtm, parentGuardianDetails, previousAcademic, studentAddress, students, studentAttendance, studentBankDetails, studentBio, studentDocuments, studentProfiles, teachers, chapterDivisions, siblingDetails, homeworkSubmissions, incidents, studentLeaves, resources, resourceIssuances, examSchedules, sidebarPermissions, timetable, transportStudents, transportBuses } from "./schema";

export const chaptersRelations = relations(chapters, ({one, many}) => ({
	unit: one(units, {
		fields: [chapters.unitId],
		references: [units.id]
	}),
	chapterPdfs: many(chapterPdfs),
	chapterDivisions: many(chapterDivisions),
}));

export const unitsRelations = relations(units, ({one, many}) => ({
	chapters: many(chapters),
	subject: one(subjects, {
		fields: [units.subjectId],
		references: [subjects.id]
	}),
}));

export const declarationsRelations = relations(declarations, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [declarations.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const admissionMetaRelations = relations(admissionMeta, ({one, many}) => ({
	declarations: many(declarations),
	entranceTests: many(entranceTests),
	documentChecklists: many(documentChecklists),
	inquiry: one(inquiries, {
		fields: [admissionMeta.inquiryId],
		references: [inquiries.id]
	}),
	homeVisits: many(homeVisits),
	scholarshipAttendances: many(scholarshipAttendance),
	scholarshipCriteriaSettings: many(scholarshipCriteriaSettings),
	scholarshipHomeworks: many(scholarshipHomework),
	scholarshipGuardians: many(scholarshipGuardian),
	scholarshipRecords: many(scholarshipRecords),
	scholarshipPtms: many(scholarshipPtm),
	parentGuardianDetails: many(parentGuardianDetails),
	previousAcademics: many(previousAcademic),
	studentAddresses: many(studentAddress),
	studentBankDetails: many(studentBankDetails),
	studentBios: many(studentBio),
	studentDocuments: many(studentDocuments),
	studentProfiles: many(studentProfiles),
	siblingDetails: many(siblingDetails),
}));

export const chapterPdfsRelations = relations(chapterPdfs, ({one}) => ({
	chapter: one(chapters, {
		fields: [chapterPdfs.chapterId],
		references: [chapters.id]
	}),
}));

export const entranceTestsRelations = relations(entranceTests, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [entranceTests.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const documentChecklistsRelations = relations(documentChecklists, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [documentChecklists.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const inquiriesRelations = relations(inquiries, ({many}) => ({
	admissionMetas: many(admissionMeta),
}));

export const lessonPlansRelations = relations(lessonPlans, ({one, many}) => ({
	user_teacherId: one(users, {
		fields: [lessonPlans.teacherId],
		references: [users.id],
		relationName: "lessonPlans_teacherId_users_id"
	}),
	class: one(classes, {
		fields: [lessonPlans.classId],
		references: [classes.id]
	}),
	subject: one(subjects, {
		fields: [lessonPlans.subjectId],
		references: [subjects.id]
	}),
	user_reviewerId: one(users, {
		fields: [lessonPlans.reviewerId],
		references: [users.id],
		relationName: "lessonPlans_reviewerId_users_id"
	}),
	homeworkSubmissions: many(homeworkSubmissions),
}));

export const usersRelations = relations(users, ({many}) => ({
	lessonPlans_teacherId: many(lessonPlans, {
		relationName: "lessonPlans_teacherId_users_id"
	}),
	lessonPlans_reviewerId: many(lessonPlans, {
		relationName: "lessonPlans_reviewerId_users_id"
	}),
	studentProfiles: many(studentProfiles),
	teachers: many(teachers),
	homeworkSubmissions: many(homeworkSubmissions),
	examSchedules: many(examSchedules),
	sidebarPermissions: many(sidebarPermissions),
}));

export const classesRelations = relations(classes, ({many}) => ({
	lessonPlans: many(lessonPlans),
	studentAttendances: many(studentAttendance),
	students: many(students),
	subjects: many(subjects),
	incidents: many(incidents),
	studentLeaves: many(studentLeaves),
	examSchedules: many(examSchedules),
	timetables: many(timetable),
}));

export const subjectsRelations = relations(subjects, ({one, many}) => ({
	lessonPlans: many(lessonPlans),
	class: one(classes, {
		fields: [subjects.classId],
		references: [classes.id]
	}),
	units: many(units),
	examSchedules: many(examSchedules),
	timetables: many(timetable),
}));

export const homeVisitsRelations = relations(homeVisits, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [homeVisits.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const scholarshipAttendanceRelations = relations(scholarshipAttendance, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [scholarshipAttendance.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const scholarshipCriteriaSettingsRelations = relations(scholarshipCriteriaSettings, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [scholarshipCriteriaSettings.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const scholarshipHomeworkRelations = relations(scholarshipHomework, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [scholarshipHomework.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const scholarshipGuardianRelations = relations(scholarshipGuardian, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [scholarshipGuardian.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const scholarshipRecordsRelations = relations(scholarshipRecords, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [scholarshipRecords.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const scholarshipPtmRelations = relations(scholarshipPtm, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [scholarshipPtm.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const parentGuardianDetailsRelations = relations(parentGuardianDetails, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [parentGuardianDetails.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const previousAcademicRelations = relations(previousAcademic, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [previousAcademic.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const studentAddressRelations = relations(studentAddress, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [studentAddress.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const studentAttendanceRelations = relations(studentAttendance, ({one}) => ({
	student: one(students, {
		fields: [studentAttendance.studentId],
		references: [students.id]
	}),
	class: one(classes, {
		fields: [studentAttendance.classId],
		references: [classes.id]
	}),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	studentAttendances: many(studentAttendance),
	class: one(classes, {
		fields: [students.classId],
		references: [classes.id]
	}),
	homeworkSubmissions: many(homeworkSubmissions),
	incidents: many(incidents),
	studentLeaves: many(studentLeaves),
	resourceIssuances: many(resourceIssuances),
	transportStudents: many(transportStudents),
}));

export const studentBankDetailsRelations = relations(studentBankDetails, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [studentBankDetails.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const studentBioRelations = relations(studentBio, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [studentBio.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const studentDocumentsRelations = relations(studentDocuments, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [studentDocuments.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const studentProfilesRelations = relations(studentProfiles, ({one}) => ({
	user: one(users, {
		fields: [studentProfiles.userId],
		references: [users.id]
	}),
	admissionMeta: one(admissionMeta, {
		fields: [studentProfiles.admissionMetaId],
		references: [admissionMeta.id]
	}),
}));

export const teachersRelations = relations(teachers, ({one, many}) => ({
	user: one(users, {
		fields: [teachers.userId],
		references: [users.id]
	}),
	subjects: many(subjects),
	incidents: many(incidents),
	resourceIssuances: many(resourceIssuances),
	timetables: many(timetable),
}));

export const chapterDivisionsRelations = relations(chapterDivisions, ({one}) => ({
	chapter: one(chapters, {
		fields: [chapterDivisions.chapterId],
		references: [chapters.id]
	}),
}));

export const siblingDetailsRelations = relations(siblingDetails, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [siblingDetails.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const homeworkSubmissionsRelations = relations(homeworkSubmissions, ({one}) => ({
	lessonPlan: one(lessonPlans, {
		fields: [homeworkSubmissions.lessonPlanId],
		references: [lessonPlans.id]
	}),
	student: one(students, {
		fields: [homeworkSubmissions.studentId],
		references: [students.id]
	}),
	user: one(users, {
		fields: [homeworkSubmissions.reviewedBy],
		references: [users.id]
	}),
}));

export const incidentsRelations = relations(incidents, ({one}) => ({
	class: one(classes, {
		fields: [incidents.classId],
		references: [classes.id]
	}),
	student: one(students, {
		fields: [incidents.studentId],
		references: [students.id]
	}),
	teacher: one(teachers, {
		fields: [incidents.teacherId],
		references: [teachers.id]
	}),
}));

export const studentLeavesRelations = relations(studentLeaves, ({one}) => ({
	student: one(students, {
		fields: [studentLeaves.studentId],
		references: [students.id]
	}),
	class: one(classes, {
		fields: [studentLeaves.classId],
		references: [classes.id]
	}),
}));

export const resourceIssuancesRelations = relations(resourceIssuances, ({one}) => ({
	resource: one(resources, {
		fields: [resourceIssuances.resourceId],
		references: [resources.id]
	}),
	student: one(students, {
		fields: [resourceIssuances.studentId],
		references: [students.id]
	}),
	teacher: one(teachers, {
		fields: [resourceIssuances.teacherId],
		references: [teachers.id]
	}),
}));

export const resourcesRelations = relations(resources, ({many}) => ({
	resourceIssuances: many(resourceIssuances),
}));

export const examSchedulesRelations = relations(examSchedules, ({one}) => ({
	class: one(classes, {
		fields: [examSchedules.classId],
		references: [classes.id]
	}),
	subject: one(subjects, {
		fields: [examSchedules.subjectId],
		references: [subjects.id]
	}),
	user: one(users, {
		fields: [examSchedules.createdBy],
		references: [users.id]
	}),
}));

export const sidebarPermissionsRelations = relations(sidebarPermissions, ({one}) => ({
	user: one(users, {
		fields: [sidebarPermissions.userId],
		references: [users.id]
	}),
}));

export const timetableRelations = relations(timetable, ({one}) => ({
	class: one(classes, {
		fields: [timetable.classId],
		references: [classes.id]
	}),
	subject: one(subjects, {
		fields: [timetable.subjectId],
		references: [subjects.id]
	}),
	teacher: one(teachers, {
		fields: [timetable.teacherId],
		references: [teachers.id]
	}),
}));

export const transportStudentsRelations = relations(transportStudents, ({one}) => ({
	student: one(students, {
		fields: [transportStudents.studentId],
		references: [students.id]
	}),
	transportBus: one(transportBuses, {
		fields: [transportStudents.busId],
		references: [transportBuses.id]
	}),
}));

export const transportBusesRelations = relations(transportBuses, ({many}) => ({
	transportStudents: many(transportStudents),
}));