# Criteria Threshold Changes - How It Works

## Question
If I change criteria thresholds (e.g., 90% → 80%, guardian 4/5 → 3/5), will the scholarship system use the new thresholds?

## Answer: YES! ✅

The system now **dynamically uses criteria settings from the database** for all thresholds.

---

## How Each Criterion Works

### 1. **Attendance Threshold** ✅ (Dynamic)

**Database Field**: `attendance_threshold` (default: 90)

**Logic**:
```typescript
if (attendancePercentage >= criteria.attendanceThreshold) {
  award = criteria.attendanceAmount; // Full amount (e.g., ₹750)
} else {
  award = (attendancePercentage / 100) * criteria.attendanceAmount; // Proportional
}
```

**Example**:
- **Old Criteria**: threshold = 90%, amount = ₹750
  - Student has 85% → Gets ₹638 (proportional)
  
- **New Criteria**: threshold = 80%, amount = ₹750
  - Student has 85% → Gets ₹750 (full amount! ✅)

---

### 2. **Homework Threshold** ✅ (Dynamic)

**Database Field**: `homework_threshold` (default: 90)

**Logic**: Same as attendance
```typescript
if (homeworkPercentage >= criteria.homeworkThreshold) {
  award = criteria.homeworkAmount;
} else {
  award = (homeworkPercentage / 100) * criteria.homeworkAmount;
}
```

**Example**:
- **Old Criteria**: threshold = 90%, amount = ₹750
  - Student has 88% → Gets ₹660 (proportional)
  
- **New Criteria**: threshold = 80%, amount = ₹750
  - Student has 88% → Gets ₹750 (full amount! ✅)

---

### 3. **Guardian Rating Threshold** ✅ (NOW FIXED!)

**Database Field**: `guardian_rating_threshold` (default: 8 out of 10)

**Important**: The threshold is stored as `/10` in database, but converted to `/5` for use:
- Database: 8/10
- Used in code: 4/5 (8 ÷ 2 = 4)

**Logic**:
```typescript
const thresholdOutOf5 = criteria.guardianRatingThreshold / 2;

if (guardianRating >= thresholdOutOf5) {
  award = criteria.guardianAmount;
} else {
  award = (guardianRating / 5) * criteria.guardianAmount;
}
```

**Example**:
- **Old Criteria**: threshold = 8/10 (4/5), amount = ₹750
  - Student has 3.5/5 → Gets ₹525 (proportional)
  
- **New Criteria**: threshold = 6/10 (3/5), amount = ₹750
  - Student has 3.5/5 → Gets ₹750 (full amount! ✅)

---

### 4. **PTM** ✅ (No threshold needed)

**Logic**: All or nothing
```typescript
if (ptmAttended) {
  award = criteria.ptmAmount;
} else {
  award = 0;
}
```

---

## How to Change Criteria

### Option 1: Global Criteria (All Students)
1. Go to: **Scholarship → Criteria Settings**
2. Find criteria for academic year (e.g., "2025-26")
3. Update thresholds:
   - `attendance_threshold`: 90 → 80
   - `homework_threshold`: 90 → 80
   - `guardian_rating_threshold`: 8 → 6 (means 3/5)
4. Save

**Result**: All future saves will use new thresholds

### Option 2: Student-Specific Override
1. Create criteria with same academic year
2. Set `admission_id` to specific student
3. Set custom thresholds for that student
4. Save

**Result**: That student uses custom thresholds, others use global

---

## When Changes Take Effect

### ✅ **Future Months**: Automatic
- July not saved yet
- You change threshold: 90% → 80%
- Teacher saves July
- **Result**: July uses 80% threshold ✅

### ✅ **Past Months**: Re-save Required
- June already saved with 90% threshold
- You change threshold: 90% → 80%
- June still shows old calculation
- Teacher reopens June and clicks "Save"
- **Result**: June recalculates with 80% threshold ✅

---

## Testing Your Changes

### Test Query:
```sql
-- See what criteria are active
SELECT 
  academic_year,
  admission_id,
  attendance_threshold,
  homework_threshold,
  guardian_rating_threshold,
  attendance_amount,
  homework_amount,
  guardian_amount,
  ptm_amount
FROM scholarship_criteria_settings
WHERE academic_year = '2025-26'
ORDER BY admission_id NULLS FIRST;
```

### Test Calculation:
1. Change threshold: 90 → 80
2. Find student with 85% attendance
3. Save their scholarship
4. Check result:
   - Should get FULL ₹750 (not proportional ₹638)

---

## Summary

| Change | Works? | Notes |
|--------|--------|-------|
| Attendance threshold (90 → 80) | ✅ YES | Fully dynamic from database |
| Homework threshold (90 → 80) | ✅ YES | Fully dynamic from database |
| Guardian threshold (8/10 → 6/10) | ✅ YES | NOW FIXED! Converts /10 to /5 |
| Attendance amount (₹750 → ₹800) | ✅ YES | Fully dynamic from database |
| PTM amount (₹750 → ₹1000) | ✅ YES | Fully dynamic from database |

**All criteria changes work automatically for future months!** 🎉
