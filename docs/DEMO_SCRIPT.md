# EMR AI - Demo Video Script

**Duration:** ~5-7 minutes  
**Tools:** Screen recording software (Loom, OBS, QuickTime)

---

## 1. Introduction (30 seconds)

**Narration:**
> "This is EMR AI - an AI-augmented Electronic Medical Records system built with Next.js, TypeScript, and integrated with OpenAI for clinical decision support."

**Actions:**
- Show the dashboard at `http://localhost:3300`
- Highlight the clean, modern UI

---

## 2. Patient List & Search (45 seconds)

**Narration:**
> "The patients page shows all active inpatients with real-time status indicators. Notice the loading skeletons that appear while data loads."

**Actions:**
- Navigate to `/patients`
- Show the patient list with 23 patients
- Demonstrate search functionality (search "John" or "CHF")
- Point out status badges (critical, high, moderate, low)

---

## 3. Patient Admission (1 minute)

**Narration:**
> "Admitting a new patient is streamlined with our form builder. Let me demonstrate creating a new admission."

**Actions:**
- Click "Admit New Patient" button
- Fill out patient form:
  - Name: "Demo Patient"
  - DOB: Pick a date
  - Gender: Select
  - Chief complaint: "Chest pain"
- Submit and show success toast

---

## 4. Morning Triage - AI Feature (1 minute)

**Narration:**
> "The Morning Triage feature uses AI to prioritize patients based on clinical acuity. It identifies risk factors and suggests quick wins for the day."

**Actions:**
- Navigate to `/triage`
- Show the AI-generated patient prioritization
- Highlight:
  - Risk level badges
  - Risk factors for each patient
  - Quick win suggestions
  - System alerts

---

## 5. Discharge Planning (45 seconds)

**Narration:**
> "Discharge planning shows patients by readiness status - who's ready to go today, who's close, and who needs more time."

**Actions:**
- Navigate to `/discharge-planning`
- Show the three summary cards (Ready Today, Ready Soon, Not Ready)
- Scroll through the discharge queue table
- Point out blocking factors and pending tests

---

## 6. AI Clinical Decision Support (1 minute)

**Narration:**
> "Our AI integration provides clinical decision support including diagnostic assistance, billing optimization, and patient summarization."

**Actions:**
- Show API routes exist:
  - `/api/ai/diagnostic-assist`
  - `/api/ai/billing-assist`
  - `/api/ai/summarize`
  - `/api/ai/morning-triage`
  - `/api/ai/discharge-readiness`

---

## 7. Mobile Responsiveness (30 seconds)

**Narration:**
> "The application is fully responsive. Watch how the sidebar collapses into a hamburger menu on mobile."

**Actions:**
- Resize browser to mobile width
- Show hamburger menu appearing
- Open/close mobile sidebar
- Show responsive grid layouts

---

## 8. Appointments & Scheduling (45 seconds)

**Narration:**
> "The appointments system supports full CRUD operations with calendar views and telehealth integration."

**Actions:**
- Navigate to `/appointments`
- Show calendar view
- Navigate to `/telemedicine`
- Show Jitsi integration

---

## 9. Admin Features (30 seconds)

**Narration:**
> "Admin features include a form builder for custom questionnaires and an audit log for compliance."

**Actions:**
- Navigate to `/admin/forms`
- Show form builder interface
- Navigate to `/admin/audit`
- Show audit log entries

---

## 10. Technical Stack (30 seconds)

**Narration:**
> "Under the hood, EMR AI uses Next.js 14, TypeScript, Tailwind CSS, shadcn/ui components, an Aidbox FHIR backend, and OpenAI GPT-4 for AI features. The codebase includes 57 unit tests and comprehensive rate limiting."

**Actions:**
- (Optional) Show terminal with `npm test` running
- Show Docker containers running with `docker compose ps`

---

## 11. Closing (15 seconds)

**Narration:**
> "EMR AI demonstrates how modern AI can augment clinical workflows while maintaining HIPAA-compliant architecture. Thank you for watching!"

**Actions:**
- Return to dashboard
- End recording

---

## Recording Tips

1. **Clean desktop** - Hide notifications, close unrelated apps
2. **Zoom level** - Use 100-125% browser zoom for readability
3. **Slow movements** - Move cursor deliberately
4. **Pause** - Wait 1-2 seconds between sections
5. **Audio** - Use a good microphone, speak clearly
6. **Resolution** - Record at 1080p minimum

## Quick Commands Before Recording

```bash
# Start Docker services
cd /Users/osamahabdallah/EMM/emr-ai
docker compose up -d

# Start dev server on port 3300
npm run dev

# Verify everything is running
curl http://localhost:8103/healthcheck
curl http://localhost:3300
```
