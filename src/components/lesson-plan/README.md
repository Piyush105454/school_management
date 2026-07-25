# Lesson Plan Step Components

Standalone React components for the 11-step DPS Lesson Plan form with exact HTML styling.

## ✅ Available Components (7/11)

### Step 1: Lesson Details
```tsx
import Step1LessonDetails from '@/components/lesson-plan/Step1LessonDetails';

<Step1LessonDetails 
  formData={formData} 
  setFormData={setFormData} 
  isEditable={true} 
/>
```

### Step 2: Objective
```tsx
import Step2Objective from '@/components/lesson-plan/Step2Objective';

<Step2Objective 
  formData={formData} 
  setFormData={setFormData} 
  isEditable={true} 
/>
```

### Step 7: Learning Indicators
```tsx
import Step7LearningIndicators from '@/components/lesson-plan/Step7LearningIndicators';

<Step7LearningIndicators 
  formData={formData} 
  setFormData={setFormData} 
  isEditable={true} 
/>
```

### Step 8: Homework
```tsx
import Step8Homework from '@/components/lesson-plan/Step8Homework';

<Step8Homework 
  formData={formData} 
  setFormData={setFormData} 
  isEditable={true} 
/>
```

### Step 9: Energizer
```tsx
import Step9Energizer from '@/components/lesson-plan/Step9Energizer';

<Step9Energizer 
  formData={formData} 
  setFormData={setFormData} 
  isEditable={true} 
/>
```

### Step 10: Closure & Reward
```tsx
import Step10Closure from '@/components/lesson-plan/Step10Closure';

<Step10Closure 
  formData={formData} 
  setFormData={setFormData} 
  isEditable={true} 
/>
```

### Step 11: Review & Submit
```tsx
import Step10ReviewUI from '@/components/lesson-plan/Step10ReviewUI';

<Step10ReviewUI 
  formData={completeFormData} 
  onSubmit={handleSubmit}
  isEditable={true}
/>
```

## 📦 Props Interface

All step components share a common props structure:

```typescript
interface StepProps {
  formData: {
    // Step-specific fields
    [key: string]: any;
  };
  setFormData: (updater: (prev: any) => any) => void;
  isEditable?: boolean; // Default: true
}
```

## 🎨 Styling

All components use **styled-jsx** with exact styling from `DPS_Lesson_Plan_Preparation_Form_V5.html`:

- **Green** (`#2f7d62`): Primary actions, checkmarks, eyebrow text
- **Navy** (`#17324d`): Headers, titles, labels
- **Gold** (`#c99a34`): Hero art boxes
- **Paper** (`#fffdf7`): Background, card backgrounds
- **Red** (`#b95a50`): Required field asterisks

## 📝 Form Data Structure

### Step 1 Fields
```typescript
{
  className: string;
  subject: string;
  chapterNo: string;
  chapterName: string;
  pageFrom: string;
  pageTo: string;
  prepDate: string;
  deliveryDate: string;
  preparedBy: string;
  reviewerName?: string;
  approverName?: string;
  lessonType: 'Explanation' | 'Q&A';
}
```

### Step 2 Fields
```typescript
{
  objectiveVerb: string; // 'understand' | 'identify' | 'describe' | etc.
  objectiveText: string;
}
```

### Step 7 Fields
```typescript
{
  indicator1: string; // Required
  indicator2: string; // Required
  indicator3?: string; // Optional
}
```

### Step 8 Fields
```typescript
{
  homeworkGiven: 'Yes' | 'No';
  homeworkTask?: string; // Required if homeworkGiven === 'Yes'
  homeworkDue?: string; // Date string
  homeworkInstruction?: string;
}
```

### Step 9 Fields
```typescript
{
  energizer: string; // One of 15 predefined activities
  energizerPractised?: boolean;
}
```

### Step 10 Fields
```typescript
{
  rewardType: string; // 'Praise / Appreciation' | 'Points' | etc.
  rewardCriteria: string;
}
```

## 🔧 Usage Example

```tsx
'use client';

import { useState } from 'react';
import Step1LessonDetails from '@/components/lesson-plan/Step1LessonDetails';
import Step2Objective from '@/components/lesson-plan/Step2Objective';
// ... import other steps

export default function LessonPlanForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  return (
    <div>
      {currentStep === 0 && (
        <Step1LessonDetails 
          formData={formData} 
          setFormData={setFormData} 
        />
      )}
      {currentStep === 1 && (
        <Step2Objective 
          formData={formData} 
          setFormData={setFormData} 
        />
      )}
      {/* ... render other steps based on currentStep */}
      
      <div className="navigation">
        <button onClick={() => setCurrentStep(prev => prev - 1)}>
          Previous
        </button>
        <button onClick={() => setCurrentStep(prev => prev + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
```

## ⚠️ Important Notes

1. **Lesson Type Conditional Rendering:**
   - Step 5 (Lesson Activity) should be **completely skipped** for Q&A lesson type
   - Step 4 changes title from "Discussion & Participation" to "Inspection & Support" for Q&A

2. **Required Fields:**
   - All fields marked with `*` in the UI are required
   - Step 8 homework fields are conditionally required (only when "Yes" is selected)

3. **Energizer Activities:**
   - 15 predefined activities (see `Step9Energizer.tsx` for full list)
   - Activities are categorized as "Sitting" or "Standing at place"

4. **Objective Verbs:**
   - 12 predefined verbs: understand, identify, describe, explain, differentiate, compare, demonstrate, apply, solve, analyse, create, summarise

5. **Reward Types:**
   - 6 types: Praise/Appreciation, Points, Recognition Card, Small Item, Class Applause, No material reward

## 📂 File Structure

```
src/components/lesson-plan/
├── README.md                    # This file
├── AllStepsStyles.css           # Shared styles (reference)
├── Step1LessonDetails.tsx       # ✅ Complete
├── Step2Objective.tsx           # ✅ Complete
├── Step3TeachingNotes.tsx       # ⏳ To be created
├── Step4Discussion.tsx          # ⏳ To be created
├── Step5LessonActivity.tsx      # ⏳ To be created
├── Step6LessonIntroduction.tsx  # ⏳ To be created
├── Step7LearningIndicators.tsx  # ✅ Complete
├── Step8Homework.tsx            # ✅ Complete
├── Step9Energizer.tsx           # ✅ Complete
├── Step10Closure.tsx            # ✅ Complete
├── Step10ReviewUI.tsx           # ✅ Complete
└── Step10ReviewUI.css           # Review page styles
```

## 🔗 Related Documentation

- **Implementation Guide:** `/LESSON_PLAN_STEPS_IMPLEMENTATION.md`
- **Progress Tracker:** `/LESSON_PLAN_PROGRESS.md`
- **HTML Reference:** `/DPS_Lesson_Plan_Preparation_Form_V5.html`
- **Database Schema:** `/src/db/schema.ts`

## 🚀 Next Steps

To complete the implementation:
1. Create remaining 4 components (Steps 3, 4, 5, 6)
2. Build main form wrapper with step navigation
3. Implement data persistence to database
4. Add validation and error handling
5. Test complete user flow

---

**Last Updated:** July 24, 2026  
**Status:** 7 out of 11 components completed
