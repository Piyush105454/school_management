# Lesson Plan 11-Step Implementation Guide

## Overview
Creating separate React components for each of the 11 steps from the DPS Lesson Plan HTML, matching exact styling and functionality.

## Database Structure
The `lessonPlans` table stores:
- `step1Data`: JSON string (Teacher's notes, Homework)
- `step2Data`: JSON string (All 11 steps data)

## All 11 Steps Components

### ✅ Step 1: Lesson Details - COMPLETED
**File:** `src/components/lesson-plan/Step1LessonDetails.tsx` ✅
**Fields:**
- Class (select dropdown)
- Subject (select dropdown)
- Chapter Number (text input)
- Chapter Name (text input)
- Page From (number input)
- Page To (number input)
- Preparation Date (date input)
- Delivery Date (date input)
- Prepared By (text input)
- Reviewer (text input)
- Approver (text input)
- Lesson Plan Type (radio: Explanation / Q&A)
**Status:** Component created with exact HTML styling

### ✅ Step 2: Objective - COMPLETED
**File:** `src/components/lesson-plan/Step2Objective.tsx` ✅
**Fields:**
- Objective Verb (select dropdown: identify, explain, describe, etc.)
- Objective Text (textarea)
- Live preview of complete objective sentence
**Status:** Component created with exact HTML styling

### ✅ Step 3: Teaching Notes
**File:** `Step3TeachingNotes.tsx`
**Fields:**
- Teaching Notes (rich textarea)
- References (textarea)

### ✅ Step 4: Discussion & Participation
**File:** `Step4Discussion.tsx`
**Fields:**
- For Explanation: Discussion Plan (textarea)
- For Q&A: Chapter Summary & Revision (textarea)
- Quieter Student Support (textarea)

### ✅ Step 5: Lesson Activity
**File:** `Step5LessonActivity.tsx`
**Fields:** (Only for Explanation type, skip for Q&A)
- Activity Title (text input)
- Activity Mode (select: Notebook-based, Oral, Demonstration, etc.)
- Activity Steps (textarea)
- Materials (textarea)
- Teacher's Role (textarea)
- Success Check (textarea)

### ✅ Step 6: Lesson Introduction
**File:** `Step6LessonIntroduction.tsx`
**Fields:**
- Lesson Introduction/Hook (textarea)
- Connection to Prior Learning (textarea)

### ✅ Step 7: Learning Indicators - COMPLETED
**File:** `src/components/lesson-plan/Step7LearningIndicators.tsx` ✅
**Fields:**
- Indicator 1 (text input) *required
- Indicator 2 (text input) *required
- Indicator 3 (text input) *optional
**Status:** Component created with numbered indicator layout

### ✅ Step 8: Homework
**File:** `Step8Homework.tsx` ✅ COMPLETED
**Fields:**
- Will you give homework? (radio: Yes / No) *required
- Homework Task (textarea) - shows if Yes
- Submission Date (date input) - shows if Yes
- Special Instruction (textarea) - shows if Yes

### ✅ Step 9: Energizer - COMPLETED
**File:** `src/components/lesson-plan/Step9Energizer.tsx` ✅
**Fields:**
- Energizer Activity (select dropdown with 15 activities)
- Activity Preview (auto-display based on selection)
- I have practised it once (checkbox)
**Status:** Component created with all 15 energizer activities and live preview

### ✅ Step 10: Closure & Reward - COMPLETED
**File:** `src/components/lesson-plan/Step10Closure.tsx` ✅
**Fields:**
- Reward Type (select: Praise/Appreciation, Points, Recognition Card, etc.)
- Who will be recognised, and why? (textarea) *required
**Status:** Component created with all reward types

### ✅ Step 11: Review & Submit
**File:** `Step10ReviewUI.tsx` ✅ ALREADY CREATED
**Features:**
- Shows complete lesson plan preview
- Completion percentage
- Note to reviewer (textarea)
- Ownership confirmation (checkbox)
- Mark ready for reviewer (button)
- Print/Save as PDF (button)

## Energizer Activities (Step 9)
1. Follow My Taali (Sitting)
2. Aam–Kela–Papita Rhythm (Sitting)
3. Count and Clap (Sitting)
4. Clap–Lap–Snap (Sitting)
5. Finger Spider Walk (Sitting)
6. Finger Copy Challenge (Sitting)
7. Up–Down–Left–Right Hands (Sitting)
8. Machhli Jal Ki Rani – Hand Actions (Sitting)
9. Aloo Kachaloo – Expression Actions (Sitting)
10. Lakdi Ki Kathi – Horse Beat (Sitting)
11. Teacher Says – Shikshak Kehte Hain (Standing at place)
12. Opposite Action Challenge (Standing at place)
13. Red Light–Green Light at Place (Standing at place)
14. Move and Freeze (Standing at place)
15. Cross-Touch Brain Gym (Standing at place)

## Objective Verbs (Step 2)
- identify
- explain
- describe
- analyze
- compare
- create
- understand
- apply
- evaluate
- remember

## Activity Modes (Step 5)
- Notebook-based
- Oral / discussion-based
- Demonstration
- Material-based
- Pair work at bench
- Individual practice

## Reward Types (Step 10)
- Praise / Appreciation
- Points
- Recognition Card
- Small Item
- Class Applause
- No material reward

## Styling
All components use:
- `AllStepsStyles.css` for shared styles
- Exact colors from HTML (#2f7d62 green, #17324d navy, #c99a34 gold)
- Same layout, spacing, and responsive breakpoints
- Hero section with eyebrow, title, description, and emoji art

## Next Steps
1. ✅ Create shared CSS file
2. Create Step 1-7 components
3. Create Step 9-10 components
4. Create main form component that uses all steps
5. Add navigation between steps
6. Add progress tracking
7. Add data persistence to database
