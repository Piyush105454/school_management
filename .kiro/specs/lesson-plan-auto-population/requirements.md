# Requirements Document: Lesson Plan Form Auto-Population

## Introduction

Teachers creating lesson plans need to have form fields automatically populated with data from the system (teacher name, chapter page ranges, reviewers, and approvers) to reduce manual data entry and improve form-filling speed. This feature enhances user experience by fetching database values for chapters, subjects, and assigned staff roles.

## Glossary

- **Teacher**: User with TEACHER role preparing lesson plans
- **Chapter**: A unit of study within a subject textbook that has a page range (page from/to)
- **Page Range**: The starting and ending page numbers for a chapter (pageStart and pageEnd)
- **Auto-Population**: Automatic filling of form fields based on database values or system state
- **Reviewer**: Teacher assigned to review lesson plans for a subject (up to 2 reviewers)
- **Approver**: Principal responsible for approving lesson plans for a class
- **Prepared By Field**: Form field showing which teacher created the lesson plan
- **Subject Details**: Database record containing chapter information, reviewer names, and page ranges for a subject

## Requirements

### Requirement 1

**User Story:** As a teacher, I want my name to automatically appear in the "Prepared By" field, so that I don't have to manually enter it.

#### Acceptance Criteria

1. WHEN a teacher opens the lesson plan form THEN the "Prepared By" field SHALL display the logged-in teacher's name from the session
2. WHEN the "Prepared By" field is populated THEN it SHALL be read-only (disabled for editing)
3. WHEN a teacher's session data is available THEN the "Prepared By" field SHALL be set to the session user's name within page load

### Requirement 2

**User Story:** As a teacher, I want chapter page ranges to automatically populate when I select a chapter, so that I can move faster through the form.

#### Acceptance Criteria

1. WHEN a teacher selects a class and subject THEN the system SHALL fetch available chapters for that subject
2. WHEN a teacher selects a chapter from the dropdown THEN the "Page From" field SHALL automatically populate with the chapter's starting page number from the database
3. WHEN a chapter is selected THEN the "Page To" field SHALL automatically populate with the chapter's ending page number from the database
4. WHEN chapter page ranges are auto-filled THEN both fields SHALL be read-only (disabled for editing)
5. IF the selected chapter has no page data in the database THEN the fields SHALL remain empty but not display errors

### Requirement 3

**User Story:** As a teacher, I want to see the chapter name automatically filled in, so that I can verify I selected the correct chapter.

#### Acceptance Criteria

1. WHEN a teacher selects a chapter THEN the "Chapter Name" field SHALL automatically populate with the chapter name from the database
2. WHEN the chapter name is populated THEN it SHALL be read-only (disabled for editing)
3. IF no chapter name exists in the database THEN the field SHALL remain empty

### Requirement 4

**User Story:** As a teacher, I want reviewer names to be automatically populated based on the subject I selected, so that I don't need to look them up.

#### Acceptance Criteria

1. WHEN a teacher selects a subject for a class THEN the system SHALL fetch assigned reviewer names for that subject
2. WHEN reviewer data is available THEN the "Reviewer" field SHALL display the reviewer name(s) in the form
3. IF two reviewers are assigned to the subject THEN the display SHALL show both names separated by a pipe (|)
4. IF no reviewers are assigned THEN the field SHALL display "NA"
5. WHEN reviewer names are populated THEN the field SHALL be read-only (disabled for editing)

### Requirement 5

**User Story:** As a teacher, I want the approver (principal) name to be automatically populated based on my class, so that I know who will approve my lesson plan.

#### Acceptance Criteria

1. WHEN a teacher selects a class THEN the system SHALL fetch the principal (approver) assigned to that class
2. WHEN the approver is determined THEN the "Approver" field SHALL display the principal's name
3. IF no approver is assigned to the class THEN the field SHALL display "NA"
4. WHEN the approver name is populated THEN the field SHALL be read-only (disabled for editing)

### Requirement 6

**User Story:** As a teacher, I want the preparation date to default to today's date, so that I don't have to manually set it.

#### Acceptance Criteria

1. WHEN a teacher opens the lesson plan form THEN the "Preparation Date" field SHALL default to today's date
2. WHEN the preparation date is set THEN the field SHALL be read-only (disabled for editing)
3. IF the form is edited as a draft then reopened THEN the original preparation date SHALL be preserved

### Requirement 7

**User Story:** As a teacher, I want form data loading to be fast and efficient, so that the page doesn't feel sluggish.

#### Acceptance Criteria

1. WHEN the form loads THEN all API calls for chapters, subjects, and staff assignments SHALL execute in parallel
2. WHEN chapters are loaded for a subject THEN the loading time for the "Chapter Number" dropdown SHALL be less than 2 seconds
3. WHEN a chapter is selected THEN the page range fields SHALL populate within 500ms
4. IF an API call fails THEN the system SHALL use default values or display a graceful fallback without blocking the form

