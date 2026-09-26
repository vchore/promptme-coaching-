// Static content for PromptMe. Regulation summaries were compiled on 26 Sep 2026
// from public reporting; see README.md for sources. Update `REG_STATUS` when the
// Maharashtra Act is tabled, passed or notified.

export const REG_STATUS = {
  lastReviewed: "2026-09-26",
  headline:
    "Maharashtra's coaching law is still a DRAFT. Public objections closed on 15 Sep 2026 (15,000+ received); divisional hearings come next before the Bill is finalised.",
};

export const HELPLINES = [
  {
    name: "Tele-MANAS (Govt. of India)",
    number: "14416",
    alt: "1-800-891-4416",
    note: "Free, 24x7, confidential. Marathi, Hindi, English and 20+ languages.",
  },
  {
    name: "Emergency (Police / Ambulance)",
    number: "112",
    note: "If you or someone else is in immediate danger.",
  },
];

// Draft Maharashtra Private Coaching Centres (Registration and Regulation) Act, 2026.
export const MAHARASHTRA_DRAFT = {
  title: "Draft Maharashtra Private Coaching Centres (Registration & Regulation) Act, 2026",
  published: "20 Aug 2026 by the School Education & Sports Department",
  timeline: [
    { date: "2026-08-20", text: "Draft Act published; objections invited till 4 Sep." },
    { date: "2026-09-07", text: "11,410 suggestions/objections received; deadline extended." },
    { date: "2026-09-15", text: "Consultation closed with 15,000+ submissions. No further extension." },
    { date: "Next", text: "Divisional-level hearings, then the Bill goes to the legislature." },
  ],
  provisions: [
    { area: "Registration", text: "Centres with 25+ students must register on a state portal; registration valid for 3 years." },
    { area: "Age", text: "No enrolment of children below 13 years." },
    { area: "Hours", text: "Max 5 hours of classes per day; no classes too early in the morning or late at night." },
    { area: "Weekly off", text: "At least one mandatory weekly day off for students and tutors." },
    { area: "Mental health", text: "Counselling system and immediate intervention for students in distress; details of counsellors/psychologists shared with students and parents." },
    { area: "No ranking batches", text: "Segregating students into batches by marks/performance is banned." },
    { area: "Advertising", text: "No false guarantees or misleading promises about ranks or marks." },
    { area: "Dummy schools", text: "No coaching on recognised school/college premises, no hiring their full-time teachers; 'integrated/dummy school' models prohibited." },
    { area: "Space", text: "At least 1 sq. metre per student in a classroom; infrastructure and safety standards apply." },
    { area: "Transparency", text: "Publish faculty qualifications, fees, intake capacity and refund policy online." },
    { area: "Refunds", text: "Student leaving mid-course after full payment gets a pro-rata refund within 10 days." },
    { area: "Grievances", text: "Grievance-redressal mechanism, inspections and inquiries." },
    { area: "Penalties", text: "Minor violations ₹1–5 lakh (repeat up to ₹10 lakh); major violations ₹10–50 lakh." },
  ],
  debate:
    "Coaching-class associations call the age bar, intake limits and hour caps 'unrealistic' and have threatened agitation and court challenges. Final rules may change.",
};

// Supreme Court, Sukdeb Saha v. State of Andhra Pradesh (25 Jul 2025). Binding now.
export const SC_GUIDELINES = {
  title: "Supreme Court guidelines on student mental health (Sukdeb Saha v. State of A.P., 25 Jul 2025)",
  status: "In force — binding on all schools, colleges, coaching institutes, hostels and residential academies until a law is made.",
  points: [
    "Every institution must adopt and publish a mental-health policy.",
    "Institutions with 100+ students must have at least one qualified counsellor/psychologist; smaller ones must have formal referral links.",
    "Written protocols for immediate referral to hospitals and suicide-prevention helplines; helpline numbers displayed in classrooms, hostels and common areas.",
    "All staff trained at least twice a year by certified professionals in psychological first aid and warning signs.",
    "No batch segregation by marks, no public shaming, no targets disproportionate to a student's capacity.",
    "Coaching hubs (the Court named Kota, Jaipur, Sikar, Chennai, Hyderabad, Delhi, Mumbai) need extra safeguards; residential institutions must fit tamper-proof fans and restrict rooftop access.",
    "Confidential, harassment-free grievance channels, including for caste, gender, disability and sexuality-based harassment.",
    "Structured extracurriculars and regular career counselling to reduce exam pressure.",
  ],
};

export const CENTRE_CHECKLIST = [
  { id: "reg", text: "Registered on the state portal (if 25+ students)", source: "MH Draft" },
  { id: "age", text: "No students below 13 enrolled", source: "MH Draft" },
  { id: "hours", text: "Classes ≤ 5 hours/day, no very early or late slots", source: "MH Draft" },
  { id: "off", text: "One weekly off for students and tutors", source: "MH Draft" },
  { id: "policy", text: "Written mental-health policy published", source: "SC 2025" },
  { id: "counsellor", text: "Qualified counsellor on staff (100+ students) or referral tie-up", source: "SC 2025" },
  { id: "helplines", text: "Helpline numbers (14416, 112) displayed in every room", source: "SC 2025" },
  { id: "training", text: "Staff trained in psychological first aid twice a year", source: "SC 2025" },
  { id: "batches", text: "No rank-based batches, no public display of low scores", source: "Both" },
  { id: "ads", text: "No rank/marks guarantees in advertising", source: "MH Draft" },
  { id: "refund", text: "Pro-rata refund within 10 days published", source: "MH Draft" },
  { id: "space", text: "≥ 1 sq. m per student, fire and safety compliance", source: "MH Draft" },
  { id: "grievance", text: "Confidential grievance channel for students and parents", source: "Both" },
  { id: "disclosure", text: "Faculty, fees, intake and refund policy on website", source: "MH Draft" },
];

// Prompts are grouped by purpose. Keep them short, kind and actionable.
export const PROMPTS = {
  study: [
    "Explain today's toughest concept out loud as if teaching a Class 8 student. Where did you get stuck?",
    "Pick 3 questions you got wrong this week. For each, write the exact step where it went wrong.",
    "Make a 5-line summary of one chapter without looking at your notes. Then check what you missed.",
    "What is ONE topic you are avoiding? Spend just 15 minutes on it now.",
    "Write 3 questions an examiner could ask from today's class.",
    "Solve one easy, one medium and one hard problem from the same topic.",
    "Compare two similar formulas/concepts and write when to use each.",
  ],
  reflect: [
    "What went well today, even if it was small?",
    "Which thought kept coming back today? Is it a fact or a fear?",
    "Who helped you this week? Could you thank them?",
    "What would you tell a friend who scored what you scored in the last test?",
    "One thing you are proud of that has nothing to do with marks:",
    "What do you need more of this week: sleep, help, rest or practice?",
  ],
  calm: [
    "Box breathing: in for 4, hold 4, out for 4, hold 4. Repeat 4 times.",
    "5-4-3-2-1: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
    "Stand up, stretch your arms above your head, and drink a glass of water.",
    "Step away from screens for 10 minutes. Look at something far away.",
    "Write down the worry, then write one small thing you can control about it.",
    "Your rank is not your worth. One test is one data point, not your future.",
  ],
};
