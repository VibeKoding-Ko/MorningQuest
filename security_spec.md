# Security Specification for Morning Quest

## Data Invariants
1. A Student profile can only be modified by the student (certain fields) or their teacher.
2. A Teacher can only manage their own classes and students in those classes.
3. Students can only see their own private data (MindDiary, TopicWriting) and public classmate data (Student profile basics).
4. DailyTasks are created by teachers for their classes.
5. Submissions are made by students and can be viewed by their teachers.
6. StarPieces and XP can only be updated via validated actions (e.g., mission submission, purchase). *Actually, the client SDK updates them directly in some cases, so rules must guard the transition.*
7. TeacherMappings are public for lookup but only modifiable by the teacher who created them (or during registration).

## The Dirty Dozen (Vulnerability Test Cases)
1. **Identity Spoofing**: Attempt to create a teacher profile with another user's UID.
2. **Class Hijacking**: A teacher attempts to modify or delete a class that belongs to another teacher.
3. **Student Profile Poisoning**: A student attempts to change their own `starPieces` or `xp` to a high value without a valid reason.
4. **Mind Diary Eavesdropping**: A student attempts to read another student's mind diary.
5. **Score Injection**: A student attempts to submit a score of 100 for a task they didn't complete correctly.
6. **Teacher Mapping Overwrite**: An anonymous user attempts to change the email mapping of a teacher.
7. **Shop Price Manipulation**: A student attempts to buy an item by sending a purchase record with a price of 0.
8. **Mission submission fraud**: A student submits a mission multiple times to gain extra stars.
9. **School name spam**: An anonymous user attempts to flood the schools collection with junk.
10. **Shadow fields**: Attempt to add a `role: "admin"` field to a student or teacher profile.
11. **Terminal state bypass**: Attempt to modify a submission after it's been completed.
12. **Orphaned Writes**: Create a submission for a class that the student is not part of.

## Test Runner (Mock)
A real `firestore.rules.test.ts` usually requires `firebase-js-sdk` and `@firebase/rules-unit-testing`. For this environment, we focus on the rules implementation.
