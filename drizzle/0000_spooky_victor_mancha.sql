CREATE TYPE "public"."admission_type" AS ENUM('NEW', 'RE_ADMISSION');--> statement-breakpoint
CREATE TYPE "public"."caste" AS ENUM('GEN', 'OBC', 'ST', 'SC');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('SUBMITTED', 'NOT_SUBMITTED');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F', 'O');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('PENDING', 'SHORTLISTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('OFFICE', 'STUDENT_PARENT');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('NOT_SCHEDULED', 'PENDING', 'PASS', 'FAIL');--> statement-breakpoint
CREATE TABLE "admission_meta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"academic_year" text NOT NULL,
	"admission_type" "admission_type" DEFAULT 'NEW' NOT NULL,
	"previously_applied_year" text,
	"entry_number" text NOT NULL,
	"admission_number" text,
	"scholar_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admission_meta_inquiry_id_unique" UNIQUE("inquiry_id"),
	CONSTRAINT "admission_meta_entry_number_unique" UNIQUE("entry_number"),
	CONSTRAINT "admission_meta_admission_number_unique" UNIQUE("admission_number"),
	CONSTRAINT "admission_meta_scholar_number_unique" UNIQUE("scholar_number")
);
--> statement-breakpoint
CREATE TABLE "declarations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"declaration_accepted" boolean DEFAULT false NOT NULL,
	"guardian_name" text NOT NULL,
	"signature_file" text,
	"declaration_date" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "declarations_admission_id_unique" UNIQUE("admission_id")
);
--> statement-breakpoint
CREATE TABLE "document_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"birth_certificate" "document_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"previous_marksheet" "document_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"student_photos_3" "document_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"caste_certificate" "document_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"parent_affidavit" "document_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"scholarship_letter" "document_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"transfer_certificate" "document_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"form_received_complete" boolean DEFAULT false NOT NULL,
	"received_by_name" text,
	"principal_sign_date" timestamp,
	"any_other_details" text,
	"verified_at" timestamp,
	CONSTRAINT "document_checklists_admission_id_unique" UNIQUE("admission_id")
);
--> statement-breakpoint
CREATE TABLE "entrance_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"test_date" text,
	"test_time" text,
	"location" text,
	"teacher_name" text,
	"contact_number" text,
	"status" "test_status" DEFAULT 'NOT_SCHEDULED' NOT NULL,
	"result_date" timestamp,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entrance_tests_admission_id_unique" UNIQUE("admission_id")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_name" text NOT NULL,
	"parent_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"applied_class" text NOT NULL,
	"academic_year" text NOT NULL,
	"status" "inquiry_status" DEFAULT 'PENDING' NOT NULL,
	"entry_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inquiries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE "parent_guardian_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"person_type" text NOT NULL,
	"is_single_parent" boolean DEFAULT false NOT NULL,
	"legal_guardian_type" text,
	"name" text NOT NULL,
	"mobile_number" text NOT NULL,
	"occupation" text,
	"qualification" text,
	"aadhaar_number" text,
	"samagra_number" text,
	"relation" text,
	"office_shop_name" text,
	"job_details" text,
	"photo" text
);
--> statement-breakpoint
CREATE TABLE "previous_academic" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"school_name" text NOT NULL,
	"school_type" text NOT NULL,
	"apaar_id" text,
	"pen_number" text,
	"class_last_attended" text,
	"session_year" text,
	"marks_obtained" double precision,
	"total_marks" double precision,
	"percentage" double precision,
	"pass_fail" text,
	CONSTRAINT "previous_academic_admission_id_unique" UNIQUE("admission_id")
);
--> statement-breakpoint
CREATE TABLE "sibling_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"sibling_number" integer NOT NULL,
	"name" text NOT NULL,
	"age" integer,
	"gender" "gender",
	"class_current" text,
	"school_name" text
);
--> statement-breakpoint
CREATE TABLE "student_address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"house_no" text NOT NULL,
	"ward_no" text,
	"street" text NOT NULL,
	"village" text NOT NULL,
	"tehsil" text,
	"district" text,
	"state" text,
	"pin_code" text,
	CONSTRAINT "student_address_admission_id_unique" UNIQUE("admission_id")
);
--> statement-breakpoint
CREATE TABLE "student_bank_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"bank_name" text,
	"account_holder_name" text,
	"account_number" text,
	"ifsc_code" text,
	"note" text,
	CONSTRAINT "student_bank_details_admission_id_unique" UNIQUE("admission_id")
);
--> statement-breakpoint
CREATE TABLE "student_bio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"gender" "gender" NOT NULL,
	"dob" timestamp NOT NULL,
	"age" integer NOT NULL,
	"religion" text,
	"caste" "caste" NOT NULL,
	"family_id" text,
	"blood_group" text,
	"height_cm" double precision,
	"weight_kg" double precision,
	"aadhaar_number" text,
	"samagra_id" text,
	"cwsn" boolean DEFAULT false NOT NULL,
	"cwsn_problem_desc" text,
	"student_photo" text,
	CONSTRAINT "student_bio_admission_id_unique" UNIQUE("admission_id")
);
--> statement-breakpoint
CREATE TABLE "student_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_id" uuid NOT NULL,
	"birth_certificate" text,
	"student_photo" text,
	"marksheet" text,
	"caste_certificate" text,
	"affidavit" text,
	"transfer_certificate" text,
	"scholarship_slip" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_documents_admission_id_unique" UNIQUE("admission_id")
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"admission_meta_id" uuid,
	"admission_step" integer DEFAULT 1 NOT NULL,
	"is_fully_admitted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'OFFICE' NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admission_meta" ADD CONSTRAINT "admission_meta_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_checklists" ADD CONSTRAINT "document_checklists_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrance_tests" ADD CONSTRAINT "entrance_tests_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_guardian_details" ADD CONSTRAINT "parent_guardian_details_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "previous_academic" ADD CONSTRAINT "previous_academic_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sibling_details" ADD CONSTRAINT "sibling_details_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_address" ADD CONSTRAINT "student_address_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_bank_details" ADD CONSTRAINT "student_bank_details_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_bio" ADD CONSTRAINT "student_bio_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_admission_id_admission_meta_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_admission_meta_id_admission_meta_id_fk" FOREIGN KEY ("admission_meta_id") REFERENCES "public"."admission_meta"("id") ON DELETE no action ON UPDATE no action;