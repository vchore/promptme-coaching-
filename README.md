# PromptMe Coaching

PromptMe is a small, offline-capable web app for students at coaching classes in Maharashtra. It has four jobs:

- **Prompt** students each day with study and reflection questions.
- **Check in** on mood, stress, sleep and class hours, and point students to real help when they need it.
- **Explain** what the rules say about coaching centres and student mental health, in plain language.
- **Help coaching centres** check how ready they are for those rules.

There's no account, no server and no tracking. All data stays in the browser's `localStorage`, and free-text notes are never saved.

## Features

| Tab | What it does |
|---|---|
| **Today** | Prompt of the day, a 30-second check-in and a 7-day mood strip. It warns after 3 tough days in a row and when a student has studied 7 days straight with no weekly off. |
| **Study** | Pomodoro timer (25/5, with a long break after 4 rounds), plus study and reflection prompts. |
| **Calm** | Animated box-breathing guide and quick grounding exercises. |
| **Rights** | Summary of the Supreme Court's 2025 guidelines (in force) and the draft Maharashtra Coaching Centres Act, 2026, with its status timeline. |
| **For centres** | 14-point readiness checklist. Each item is tagged with its source (MH Draft / SC 2025). |
| **Help** | Tap-to-call Tele-MANAS **14416** and **112**, warning signs to watch for in a friend, and a button to delete all data. |

**Crisis handling:** if the check-in note contains self-harm or suicide language (English, Hinglish, Marathi or Hindi), the app skips the usual advice and shows the helplines straight away. The detection is keyword-based on purpose. It is simple and easy to check, but it will not catch everything.

## Run it

```bash
npm start          # serves on http://localhost:8080 (needs python3)
npm test           # unit tests for js/logic.js (Node 18+)
```

ES modules need an HTTP server, so opening `index.html` directly from disk won't work. You can deploy to any static host (GitHub Pages, Netlify and so on). The service worker caches everything, so the helplines still work offline.

```
index.html            UI shell
css/styles.css        styles (light + dark)
js/data.js            regulations, helplines, prompts, checklist  ← update when the law changes
js/logic.js           pure logic: check-in scoring, crisis detection, streaks
js/app.js             DOM wiring
sw.js                 offline cache
tests/logic.test.js   node:test suite
```

## Android app

The `android/` folder is a [Capacitor](https://capacitorjs.com/) project that wraps the same web app. Package id: `in.promptme.coaching`.

**Get the APK without installing anything:**
1. Every push runs **Actions → Android APK** on GitHub.
2. Open the latest green run and download **PromptMe-apk** under *Artifacts*. It downloads as a zip.
3. Unzip it, copy `app-debug.apk` to the phone and open it. Allow "Install unknown apps" when Android asks.

**Build locally** (needs Node 22+, JDK 21 and the Android SDK / Android Studio):
```bash
npm install
npm run android:sync      # copy web files into android/
npx cap open android      # open in Android Studio, then Run ▶
# or: cd android && ./gradlew assembleDebug
```

After editing anything in `index.html`, `css/` or `js/`, run `npm run android:sync` again.

For the Play Store you need a signed release build (`./gradlew bundleRelease` with your own keystore) and a Google Play developer account.

## Regulatory research (as of 26 Sep 2026)

### 1. Draft Maharashtra Private Coaching Centres (Registration & Regulation) Act, 2026: **not yet law**

- Published on 20 Aug 2026 by the School Education & Sports Department.
- Objections were first due by 4 Sep. By 7 Sep there were 11,410, and the deadline moved to **15 Sep 2026**, when consultation closed with **15,000+** submissions. Divisional-level hearings come next, then the Bill goes to the legislature.
- Key provisions:
  - Registration on a state portal for centres with 25+ students, valid for 3 years.
  - **No students under 13.**
  - **Maximum 5 hours of classes a day**, with no very early or very late slots.
  - **A mandatory weekly off.**
  - **A counselling system with immediate intervention for students in distress.**
  - **No batches sorted by marks.**
  - No ads that promise ranks or marks.
  - No dummy or integrated schools.
  - At least 1 sq. m of space per student.
  - Pro-rata refund within 10 days.
  - A grievance-redressal mechanism.
  - Penalties of ₹1–5 lakh for minor violations (up to ₹10 lakh if repeated) and ₹10–50 lakh for major ones.
- Coaching-class associations have called parts of it "oppressive" and "unrealistic", especially the age bar and the intake limits. They have threatened agitation and court challenges, so the final text may change.

### 2. Supreme Court: *Sukdeb Saha v. State of Andhra Pradesh* (25 Jul 2025): **binding now**

The Court issued 15 guidelines for all schools, colleges, coaching institutes and hostels. Among them:

- Every institution needs a published mental-health policy.
- Institutions with 100+ students need a qualified counsellor.
- Staff must be trained in psychological first aid twice a year.
- Written referral protocols are required, and helpline numbers must be displayed.
- No batching by performance, no public shaming, and no targets beyond a student's capacity.
- Residential institutions need tamper-proof fans and restricted rooftop access.
- There must be confidential grievance channels.

### 3. Helplines

**Tele-MANAS 14416 / 1-800-891-4416** is free, runs 24x7 and works in 20+ languages, including Marathi. For immediate danger, call **112**.

### Sources

- [SCC Online: Draft Maharashtra Private Coaching Centres Act, 2026](https://www.scconline.com/blog/post/2026/08/25/draft-maharashtra-private-coaching-centers-act-2026/)
- [Free Press Journal: registration, fee caps, counselling rules](https://www.freepressjournal.in/mumbai/maharashtra-proposes-mandatory-registration-fee-caps-counselling-rules-for-coaching-centres)
- [Free Press Journal: 15,000+ suggestions; age, intake limits opposed](https://www.freepressjournal.in/education/maharashtra-draft-coaching-class-law-gets-over-15000-suggestions-age-student-intake-limits-face-opposition)
- [Punekar News: 11,410 objections; deadline extended to 15 Sep](https://www.punekarnews.in/maharashtra-coaching-centres-act-draft-gets-11410-suggestions-objections-feedback-deadline-extended-to-september-15/)
- [DD India: deadline extended](https://ddindia.co.in/2026/09/maharashtra-extends-deadline-till-sep-15-for-suggestions-on-draft-coaching-centres-regulation-law/)
- [Pune Pulse: 5-hour cap, dummy school ban, ₹50 lakh fines](https://www.mypunepulse.com/maharashtra-draft-coaching-centre-law-proposes-5-hour-daily-cap-dummy-school-ban-and-fines-up-to-rs-50-lakh/)
- [Mumbai Live: coaching classes oppose draft](https://www.mumbailive.com/en/education/maharashtra-coaching-classes-oppose-draft-2026-act-threaten-legal-action-over-strict-rules-94168)
- [SCC Online: Supreme Court guidelines on student mental health](https://www.scconline.com/blog/post/2025/07/25/supreme-court-guidelines-protecting-mental-health-of-coaching-and-college-students-legal-news/)
- [CMHLP: Sukdeb Saha verdict](https://cmhlp.org/blogs/a-landmark-ruling-for-student-mental-health-in-india/)
- [Tele-MANAS (MoHFW)](https://telemanas.mohfw.gov.in/)

> The regulation summaries are for awareness only and are not legal advice. When the Act is tabled, passed or notified, update `REG_STATUS` and `MAHARASHTRA_DRAFT` in `js/data.js`.
