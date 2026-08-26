import type { ScheduleItem, Suggestion } from '../types'

interface KnowledgeRow {
  keywords: string[]
  answer: string
  schedule?: ScheduleItem[]
}

const TODAY_SCHEDULE: ScheduleItem[] = [
  { icon: '📘', title: 'Database Systems', time: '09:00 AM – 10:00 AM', location: 'Room 204' },
  { icon: '💻', title: 'Data Structures', time: '11:00 AM – 12:30 PM', location: 'Room 101' },
  { icon: '👥', title: 'Study Group', time: '03:00 PM – 04:00 PM', location: 'Library Floor 2' },
]

export const KNOWLEDGE_BASE: KnowledgeRow[] = [
  {
    keywords: ['program', 'course', 'degree', 'study', 'faculty'],
    answer:
      "Victoria University Kampala runs faculties in Business & Management, Health Sciences, Law, Science & Technology, and Humanities. Popular undergraduate tracks include BBA, Public Health, Software Engineering, and LLB. Which faculty should I open up for you?",
  },
  {
    keywords: ['admission', 'apply', 'application', 'enrol', 'enroll', 'join'],
    answer:
      "Applications run online through the VU admissions portal. You'll need your O-level and A-level results, two passport photos, a copy of your national ID or passport, and the application fee receipt. Intakes open in January, May, and August.",
  },
  {
    keywords: ['schedule', 'timetable', 'class', 'classes'],
    answer: "Here's your schedule for tomorrow, Noah 👋",
    schedule: TODAY_SCHEDULE,
  },
  {
    keywords: ['register', 'registration', 'semester'],
    answer:
      'Course registration opens two weeks before each semester begins. Log into the student portal with your registration number, pick your modules, then confirm with the faculty administrator.',
  },
  {
    keywords: ['assignment', 'homework', 'coursework', 'deadline'],
    answer:
      "You have two assignments due this week: the Database Systems ER-diagram report (Friday, 11:59 PM) and the Data Structures problem set (Sunday). Want me to remind you the night before?",
  },
  {
    keywords: ['grade', 'grades', 'result', 'transcript', 'gpa'],
    answer:
      'Provisional results are posted on the student portal roughly three weeks after exams. Your current GPA is 3.6 — Database Systems and Data Structures are your strongest modules this semester.',
  },
  {
    keywords: ['hostel', 'housing', 'accommodation', 'residence', 'room'],
    answer:
      "VU partners with several accredited hostels within walking distance of the Jinja Road campus. The Dean of Students' office handles placement — first-year and international students get priority.",
  },
  {
    keywords: ['fee', 'tuition', 'cost', 'pay', 'payment', 'bursary', 'scholarship'],
    answer:
      "Tuition varies by programme and is payable per semester, with a 60% minimum required before exams. VU offers merit scholarships, sports bursaries, and a staggered payment plan through the Bursar's office.",
  },
  {
    keywords: ['library', 'book', 'study space', 'research'],
    answer:
      "The library is open 8am–10pm on weekdays, 9am–6pm on weekends. Your student ID doubles as your borrowing card, and the e-library gives you off-campus access to JSTOR and EBSCO.",
  },
  {
    keywords: ['event', 'events', 'campus life', 'club', 'society'],
    answer:
      "This week: the Tech Society's demo night on Wednesday, intramural football finals on Thursday, and a career fair in the main hall on Friday morning. Want the full campus events calendar?",
  },
  {
    keywords: ['remind', 'reminder', 'alarm'],
    answer: "Done ✅ I'll remind you at 07:45 AM tomorrow.",
  },
  {
    keywords: ['location', 'where', 'campus', 'address', 'directions'],
    answer:
      'The main campus is on Jinja Road in central Kampala, a short walk from the city centre. There’s also a satellite learning centre serving evening and weekend students.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'morning', 'afternoon', 'greet'],
    answer:
      "Hello! I'm your VU Assistant. I can help with your schedule, assignments, grades, and campus life. What would you like to know?",
  },
]

export const FALLBACK_ANSWER =
  "That's a good question. I don't have that detail on hand yet, but the Academic Registrar's office can help — or ask me about your schedule, assignments, grades, or campus life."

export const SUGGESTIONS: Suggestion[] = [
  { icon: '🗓️', label: 'My Schedule', prompt: "What's my schedule tomorrow?" },
  { icon: '📝', label: 'Assignments', prompt: 'What assignments do I have due?' },
  { icon: '🎓', label: 'Grades', prompt: 'How are my grades looking?' },
  { icon: '📚', label: 'Library Resources', prompt: 'What are the library hours?' },
  { icon: '🎉', label: 'Campus Events', prompt: "What's happening on campus this week?" },
  { icon: '💬', label: 'Ask Anything', prompt: 'Tell me about Victoria University' },
]
