# Scholarship Database Consistency Fix

## Problem
The scholarship system was calculating "Pending Money to Pay" and "Total School Fee" in multiple places (frontend components), leading to data inconsistency across the UI. If you updated one place, other places would show different values.

## Solution
**Store all financial calculations in the database** and read from there - ensuring single source of truth.

## Database Changes

### New Fields Added to `scholarship_records` table:

1. **`school_fee`** (integer, default 3000)
   - The total school fee (sum of all max scholarship amounts)
   - Calculated as: `attendanceAmount + homeworkAmount + guardianAmount + ptmAmount`
   - Typically ₹3000 (₹750 × 4 criteria)

2. **`pending_amount`** (integer, default 0)
   - The actual pending money to pay after scholarships and adjustments
   - Calculated as: `school_fee - totalAmount + adjustmentAmount`
   - Always >= 0 (using `GREATEST(0, ...)`)

### Files Modified:

#### 1. **Database Schema** (`src/db/schema.ts`)
- Added `schoolFee` and `pendingAmount` fields to scholarshipRecords table

#### 2. **Backend Action** (`src/features/scholarship/actions/kpiActions.ts`)
- Updated `saveKpiData` to calculate and save `schoolFee` and `pendingAmount`
- These values are now computed once in the backend when saving

#### 3. **Migration SQL** (`drizzle/add_school_fee_pending_amount.sql`)
- Adds new columns to existing table
- Updates all existing records with calculated values
- Creates index for faster queries on pending amounts

#### 4. **Office UI** (`src/app/(dashboard)/office/scholarship/students/[id]/StudentProfileClient.tsx`)
- Reads `schoolFee` and `pendingAmount` from database (`record.schoolFee`, `record.pendingAmount`)
- Removed frontend calculations - now displays database values

#### 5. **Student UI** (`src/app/(dashboard)/student/scholarship/ScholarshipClient.tsx`)
- Reads `schoolFee` and `pendingAmount` from database
- Monthly overview calculation now uses `record.pendingAmount`

## Benefits

✅ **Data Consistency**: One place updates, everywhere shows same data
✅ **Performance**: No repeated calculations in frontend
✅ **Accuracy**: Single source of truth in database
✅ **Maintainability**: Easier to debug and update logic

## Migration Steps

To apply these changes to your production database:

```sql
-- Run the migration SQL
psql your_database < drizzle/add_school_fee_pending_amount.sql
```

Or execute the SQL content in your database management tool.

## Testing

After migration:
1. Open any scholarship record
2. Update scores and save
3. Check "Pending Money to Pay" displays correctly
4. Navigate to different views (records list, student profile, etc.)
5. Verify all views show the same pending amount
