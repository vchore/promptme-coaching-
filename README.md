# PromptMe Coaching

PromptMe is a white-label study and wellbeing app for coaching classes in Maharashtra. Each coaching class gets its own Android app with its own name, colours, logo, contacts and notices. All the classes' apps are built from this one codebase.

There's no account, no server and no tracking. Student data stays on the phone, in `localStorage`. The daily check-in note and the wellbeing answers are never shared.

## What students get

| Tab | Features |
|---|---|
| **Profile** (set up on first launch) | Name, standard, batch, target exam (JEE, NEET, MHT-CET, Boards, MPSC/UPSC…), exam date, subjects, personal goal, and a trusted adult's phone number |
| **Home** | Greeting, exam countdown, prompt of the day, the centre's latest notices, a daily mood/stress/sleep check-in, and a 7-day mood strip |
| **Plan** | Daily goals with a streak counter, a focus timer (25 min study / 5 min break), a doubt diary per subject, and study prompts |
| **Assess** | Test-score tracker with a trend chart that compares students only with their own past results · topic confidence (Focus / Revise / Strong) · study-habits check with tips · PHQ-4 wellbeing screen · a progress report students can share by WhatsApp |
| **Calm** | Box-breathing guide, grounding exercises, reflection prompts |
| **My centre** | Address, timings, weekly off, call / WhatsApp / website / map buttons, counsellor contact, notices, and a readiness checklist for staff |
| **Rights** | Summary of the Supreme Court's 2025 student mental-health guidelines and the draft Maharashtra Coaching Centres Act, 2026 |
| **Help** | Tap-to-call contacts for the centre counsellor, the student's trusted adult, Tele-MANAS 14416 and 112. Also data backup and a delete-all-data button |

**Crisis handling:** if a check-in note contains self-harm or suicide language (English, Hinglish, Marathi or Hindi), or the PHQ-4 score is moderate or severe, the app shows the helplines straight away.

## Add a new coaching class

1. Create the class's folder:
   ```bash
   npm run new-brand -- "Shree Classes" "#1b5e20"
   ```
   This creates `brands/shree-classes/brand.json`.
2. Fill in `brand.json`:

   | Field | Example |
   |---|---|
   | `name`, `shortName`, `tagline` | "Shree Classes", "JEE & NEET, Nashik" |
   | `primary`, `accent` | `#1b5e20`. Must be dark enough for white text; the tests check this. |
   | `logo` | `logo.png` (square, at least 512×512) or `logo.svg`, placed in the same folder. Leave it blank to use the class's initials instead. |
   | `appId` | `in.promptme.shreeclasses`. This must be unique, and it can't be changed after the app is published. |
   | `phone`, `whatsapp` (digits with 91 in front), `email`, `website`, `address` | Contact details |
   | `counsellor` | `{ "name", "phone", "hours" }`. Shown in Help and in any crisis prompt. |
   | `timings`, `weeklyOff`, `notices` | `notices` is a list of `{ "date": "2026-10-05", "text": "..." }` |
3. Push to GitHub. **Actions → Android APK** builds one APK per class. Download `shree-classes-apk` from the run's Artifacts.

To preview a class in the browser, run `npm start` and open `http://localhost:8080/?brand=shree-classes`.

Each class's app has its own `appId`, so several classes' apps can sit on the same phone. Their data is also stored separately.

## Run and build

```bash
npm install
npm start                                  # web preview on :8080 (needs python3)
npm test                                   # unit tests (Node 22+)
npm run build:web -- demo-academy          # builds www/ for one class
npm run android:sync -- demo-academy       # brands android/ + copies www/ (needs no SDK)
cd android && ./gradlew assembleDebug      # needs JDK 21 + Android SDK
```

`scripts/brand-android.js` sets the app name, `applicationId`, launcher icons (made from the logo or the initials) and the icon background colour. It then runs `cap sync`. The committed `android/` folder is set to the default PromptMe brand.

Web deploys (GitHub Pages or any static host): run `npm run build:web -- <class>` and upload `www/`.

```
brands/<class>/brand.json   per-class branding, contacts, notices
index.html, css/            UI shell and styles (brand colours set via CSS variables)
js/app.js                   tabs, profile, home, centre, help
js/plan.js, js/assess.js    Plan and Assess tabs
js/logic.js                 pure, tested logic: scoring, streaks, trends, report
js/data.js                  regulations, helplines, prompts, PHQ-4, habits, exams
scripts/                    build-web, brand-android, new-brand
android/                    Capacitor Android project
```

## Android install

Download the class's APK from GitHub Actions, copy it to the phone and open it. Allow "Install unknown apps" when Android asks.

For the Play Store you need a signed release build (`./gradlew bundleRelease` with the class's own keystore), a privacy policy and a Google Play developer account, which can be the class's own.

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
