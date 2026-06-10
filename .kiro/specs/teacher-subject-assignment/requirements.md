# Requirements Document: Teacher Subject Assignment

## Introduction

This feature enables administrators to assign and manage which teachers are responsible for specific subjects within a class. Currently, subjects lack teacher assignments. This feature adds the ability to display assigned teachers, assign new teachers to subjects, and update assignments when teachers change.

## Glossary

- **Subject**: An academic course (e.g., English, Math) associated with a specific class
- **Teacher**: An educator who can be assigned to teach one or more subjects
- **Assignment**: The relationship between a teacher and a subject
- **Academy Management**: Admin section for managing academic content and structure

## Requirements

### Requirement 1

**User Story:** As an office administrator, I want to see which teacher is assigned to each subject, so that I can understand the current teaching assignments for a class.

#### Acceptance Criteria

1. WHEN viewing the subjects list for a class THEN the system SHALL display an "Assigned Teacher" column showing the currently assigned teacher name
2. WHEN a subject has no assigned teacher THEN the system SHALL display a clear indicator (e.g., "Not Assigned" or empty state)
3. WHEN viewing the subjects table THEN the system SHALL display teacher information consistently alongside other subject data

### Requirement 2

**User Story:** As an office administrator, I want to assign a teacher to a subject, so that I can establish who is responsible for teaching that subject.

#### Acceptance Criteria

1. WHEN viewing the subjects table THEN the system SHALL display an "Assign Teacher" action button for each subject
2. WHEN clicking the assign button THEN the system SHALL display a modal or form to select a teacher from available teachers
3. WHEN selecting a teacher and confirming THEN the system SHALL save the assignment to the database
4. WHEN the assignment is successful THEN the system SHALL update the UI to show the newly assigned teacher

### Requirement 3

**User Story:** As an office administrator, I want to change the teacher assigned to a subject, so that I can update assignments when teachers change roles or availability.

#### Acceptance Criteria

1. WHEN a teacher is already assigned to a subject THEN the system SHALL allow reassignment to a different teacher through the same action button
2. WHEN reassigning a teacher THEN the system SHALL replace the previous assignment with the new one
3. WHEN a reassignment is confirmed THEN the system SHALL update the database record
4. WHEN reassignment completes THEN the system SHALL reflect the change immediately in the UI

### Requirement 4

**User Story:** As a system, I want to store teacher-subject relationships reliably, so that the assignments persist and are retrievable.

#### Acceptance Criteria

1. WHEN a teacher is assigned to a subject THEN the system SHALL persist the assignment in the database
2. WHEN the page is refreshed THEN the system SHALL display the previously saved teacher assignment
3. WHEN querying subjects THEN the system SHALL include the assigned teacher information in all responses
