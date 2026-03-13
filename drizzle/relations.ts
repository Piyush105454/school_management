import { relations } from "drizzle-orm/relations";
import { admissionMeta, studentDocuments, entranceTests, declarations, documentChecklists, parentGuardianDetails, previousAcademic, siblingDetails, studentAddress, studentBankDetails, inquiries, studentBio, users, studentProfiles } from "./schema";

export const studentDocumentsRelations = relations(studentDocuments, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [studentDocuments.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const admissionMetaRelations = relations(admissionMeta, ({one, many}) => ({
	studentDocuments: many(studentDocuments),
	entranceTests: many(entranceTests),
	declarations: many(declarations),
	documentChecklists: many(documentChecklists),
	parentGuardianDetails: many(parentGuardianDetails),
	previousAcademics: many(previousAcademic),
	siblingDetails: many(siblingDetails),
	studentAddresses: many(studentAddress),
	studentBankDetails: many(studentBankDetails),
	inquiry: one(inquiries, {
		fields: [admissionMeta.inquiryId],
		references: [inquiries.id]
	}),
	studentBios: many(studentBio),
	studentProfiles: many(studentProfiles),
}));

export const entranceTestsRelations = relations(entranceTests, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [entranceTests.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const declarationsRelations = relations(declarations, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [declarations.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const documentChecklistsRelations = relations(documentChecklists, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [documentChecklists.admissionId],
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

export const siblingDetailsRelations = relations(siblingDetails, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [siblingDetails.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const studentAddressRelations = relations(studentAddress, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [studentAddress.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const studentBankDetailsRelations = relations(studentBankDetails, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [studentBankDetails.admissionId],
		references: [admissionMeta.id]
	}),
}));

export const inquiriesRelations = relations(inquiries, ({many}) => ({
	admissionMetas: many(admissionMeta),
}));

export const studentBioRelations = relations(studentBio, ({one}) => ({
	admissionMeta: one(admissionMeta, {
		fields: [studentBio.admissionId],
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

export const usersRelations = relations(users, ({many}) => ({
	studentProfiles: many(studentProfiles),
}));