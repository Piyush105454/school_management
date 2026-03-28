-- Academy Syllabus Static Master Data Seed Script

-- 1. Classes
INSERT INTO "classes" ("id", "name") VALUES 
  (1, 'Class 1'), 
  (2, 'Class 2'), 
  (3, 'Class 3'), 
  (4, 'Class 4'), 
  (5, 'Class 5'), 
  (6, 'Class 6'), 
  (7, 'Class 7'), 
  (8, 'Class 8'),
  (9, 'Nursery'),
  (10, 'LKG'),
  (11, 'UKG')
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name";

-- Reset sequence for classes
SELECT setval(pg_get_serial_sequence('classes', 'id'), coalesce(max(id), 0) + 1, false) FROM "classes";

-- 2. Subjects

-- Class 1 & 2 (4 subjects)
INSERT INTO "subjects" ("id", "class_id", "name", "medium") VALUES
  (101, 1, 'English', 'English/Hindi'),
  (102, 1, 'Mathematics', 'English/Hindi'),
  (103, 1, 'Hindi', 'English/Hindi'),
  (104, 1, 'Urdu', 'English/Hindi'),

  (201, 2, 'English', 'English/Hindi'),
  (202, 2, 'Mathematics', 'English/Hindi'),
  (203, 2, 'Hindi', 'English/Hindi'),
  (204, 2, 'Urdu', 'English/Hindi')
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "class_id" = EXCLUDED."class_id", "medium" = EXCLUDED."medium";

-- Class 3, 4, 5 (7 subjects)
INSERT INTO "subjects" ("id", "class_id", "name", "medium") VALUES
  (301, 3, 'Mathematics', 'English/Hindi'),
  (302, 3, 'Hindi', 'English/Hindi'),
  (303, 3, 'English', 'English/Hindi'),
  (304, 3, 'The World Around Us', 'English/Hindi'),
  (305, 3, 'Arts', 'English/Hindi'),
  (306, 3, 'Physical Education', 'English/Hindi'),
  (307, 3, 'Urdu', 'English/Hindi'),

  (401, 4, 'Mathematics', 'English/Hindi'),
  (402, 4, 'Hindi', 'English/Hindi'),
  (403, 4, 'English', 'English/Hindi'),
  (404, 4, 'The World Around Us', 'English/Hindi'),
  (405, 4, 'Arts', 'English/Hindi'),
  (406, 4, 'Physical Education', 'English/Hindi'),
  (407, 4, 'Urdu', 'English/Hindi'),

  (501, 5, 'Mathematics', 'English/Hindi'),
  (502, 5, 'Hindi', 'English/Hindi'),
  (503, 5, 'English', 'English/Hindi'),
  (504, 5, 'The World Around Us', 'English/Hindi'),
  (505, 5, 'Arts', 'English/Hindi'),
  (506, 5, 'Physical Education', 'English/Hindi'),
  (507, 5, 'Urdu', 'English/Hindi')
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "class_id" = EXCLUDED."class_id", "medium" = EXCLUDED."medium";

-- Class 6, 7, 8 (10 subjects)
INSERT INTO "subjects" ("id", "class_id", "name", "medium") VALUES
  (601, 6, 'Hindi', 'English/Hindi'),
  (602, 6, 'English', 'English/Hindi'),
  (603, 6, 'Mathematics', 'English/Hindi'),
  (604, 6, 'Social Science', 'English/Hindi'),
  (605, 6, 'Sanskrit', 'English/Hindi'),
  (606, 6, 'Science', 'English/Hindi'),
  (607, 6, 'Arts', 'English/Hindi'),
  (608, 6, 'Physical Education', 'English/Hindi'),
  (609, 6, 'Vocational Education', 'English/Hindi'),
  (610, 6, 'Urdu', 'English/Hindi'),

  (701, 7, 'Hindi', 'English/Hindi'),
  (702, 7, 'English', 'English/Hindi'),
  (703, 7, 'Mathematics', 'English/Hindi'),
  (704, 7, 'Social Science', 'English/Hindi'),
  (705, 7, 'Sanskrit', 'English/Hindi'),
  (706, 7, 'Science', 'English/Hindi'),
  (707, 7, 'Arts', 'English/Hindi'),
  (708, 7, 'Physical Education', 'English/Hindi'),
  (709, 7, 'Vocational Education', 'English/Hindi'),
  (710, 7, 'Urdu', 'English/Hindi'),

  (801, 8, 'Hindi', 'English/Hindi'),
  (802, 8, 'English', 'English/Hindi'),
  (803, 8, 'Mathematics', 'English/Hindi'),
  (804, 8, 'Social Science', 'English/Hindi'),
  (805, 8, 'Sanskrit', 'English/Hindi'),
  (806, 8, 'Science', 'English/Hindi'),
  (807, 8, 'Arts', 'English/Hindi'),
  (808, 8, 'Physical Education', 'English/Hindi'),
  (809, 8, 'Vocational Education', 'English/Hindi'),
  (810, 8, 'Urdu', 'English/Hindi')
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "class_id" = EXCLUDED."class_id", "medium" = EXCLUDED."medium";

-- Reset sequence for subjects
SELECT setval(pg_get_serial_sequence('subjects', 'id'), coalesce(max(id), 0) + 1, false) FROM "subjects";

-- Note: To execute this:
-- 1. Ensure the tables are pushed to your database (e.g. npx drizzle-kit push)
-- 2. Run this file in your database (e.g. via psql, pgAdmin, or a setup API route)
