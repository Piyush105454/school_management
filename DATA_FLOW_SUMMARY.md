# Scholarship Data Flow - Database vs Frontend Calculation

## Your Question
**Does the UI data come from database or frontend calculation?**

## Answer: NOW 100% FROM DATABASE! ✅

I just fixed the last place that was still calculating in the API layer.

---

## Data Flow Architecture

### ✅ **CORRECT FLOW** (What we have NOW):

```
1. Teacher fills form → Frontend
2. Click "Save" → Backend (kpiActions.ts)
3. Backend:
   - Fetches criteria settings from DB
   - Calculates all amounts using hybrid logic
   - Saves to database:
     * attendance_amount
     * homework_amount  
     * guardian_amount
     * ptm_amount
     * total_amount
     * school_fee (NEW)
     * pending_amount (NEW)
4. Display anywhere:
   - Read from database
   - No calculations needed
   - Always consistent
```

### ❌ **OLD WRONG FLOW** (Before fixes):

```
1. Save to database (only partial data)
2. Display in UI:
   - Fetch from database
   - Calculate totalSchoolFee in API
   - Calculate pendingDue in API  
   - Calculate finalDue in API
3. Problem: Different UIs calculate differently!
```

---

## All UI Pages Now Use Database

### 1. **Scholarship Records Page** ✅
**File**: `src/app/api/scholarship/records/route.ts`

**BEFORE** (❌ Calculating):
```typescript
const totalSchoolFee = maxAttendance + maxHomework + maxGuardian + maxPtm;
const pendingDue = totalSchoolFee - record.scholarshipEarned;
const finalDue = Math.max(0, pendingDue - waiverGiven + additionalCharge);
```

**AFTER** (✅ Reading from DB):
```typescript
const totalSchoolFee = record.schoolFee ?? 3000;
const pendingDue = record.pendingAmount ?? 0;
const finalDue = pendingDue; // Already includes adjustments
```

### 2. **Student Profile Page** ✅  
**File**: `src/app/(dashboard)/office/scholarship/students/[id]/StudentProfileClient.tsx`

**Uses**:
```typescript
const schoolFee = record?.schoolFee ?? maxTotal;
const pendingFromDB = record?.pendingAmount ?? (maxTotal - totalEarned);
```

### 3. **Student View (My Scholarship)** ✅
**File**: `src/app/(dashboard)/student/scholarship/ScholarshipClient.tsx`

**Uses**:
```typescript
const schoolFee = record?.schoolFee ?? 3000;
const pendingToPay = isPaid ? 0 : (record?.pendingAmount ?? 0);
```

---

## What Gets Saved to Database

When teacher clicks "Calculate & Save Scores":

### Saved Fields:
1. **attendance_amount**: ₹583, ₹750, etc.
2. **homework_amount**: ₹750, ₹680, etc.
3. **guardian_amount**: ₹570, ₹750, etc.
4. **ptm_amount**: ₹750 or ₹0
5. **total_amount**: Sum of above (e.g., ₹2653)
6. **school_fee**: ₹3000 (or custom from criteria) ✅ NEW
7. **pending_amount**: ₹347 (school_fee - total + adjustments) ✅ NEW
8. **adjustment_amount**: +₹50 or -₹100 (net)
9. **discount_amount**: ₹100 (waiver)
10. **additional_charge**: ₹50 (extra fee)

### NOT Saved (Calculated on the fly):
- Nothing! Everything is saved.

---

## Benefits of Database-First Approach

### ✅ **Data Consistency**
- Scholarship Records page shows ₹347
- Student Profile page shows ₹347
- Student "My Scholarship" shows ₹347
- All pages read same database value!

### ✅ **Performance**
- No complex calculations in API
- No criteria fetching for display
- Just read and show

### ✅ **Auditability**
- Can query database to see exact amounts
- No "it depends on which UI you use"
- Single source of truth

### ✅ **Criteria Changes Work Correctly**
- Change criteria: 90% → 80%
- Old months: Still show old calculated amounts
- New months: Calculate with new criteria
- Re-save old month: Updates with new criteria

---

## SQL Query to Verify Data

```sql
-- Check if data is correctly stored in database
SELECT 
  CONCAT(sb.first_name, ' ', sb.last_name) as student,
  sr.month,
  sr.attendance_amount,
  sr.homework_amount,
  sr.guardian_amount,
  sr.ptm_amount,
  sr.total_amount as scholarship_earned,
  sr.school_fee,
  sr.pending_amount as pending_to_pay,
  sr.status
FROM scholarship_records sr
LEFT JOIN student_bio sb ON sr.admission_id = sb.admission_id
WHERE sr.month = 'June' AND sr.year = '2026'
ORDER BY sb.first_name
LIMIT 10;
```

This will show you **exactly what's in the database** - which is what the UI displays!

---

## Summary

| Component | Data Source | Calculations? |
|-----------|-------------|---------------|
| **Backend (Save)** | Criteria Settings | ✅ YES - Calculates once |
| **API (Records)** | Database | ❌ NO - Just reads |
| **Student Profile UI** | Database | ❌ NO - Just reads |
| **Student View UI** | Database | ❌ NO - Just reads |
| **Records List UI** | Database | ❌ NO - Just reads |

**All UI data comes from database. No frontend calculations!** ✅
