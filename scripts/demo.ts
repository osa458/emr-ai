/**
 * Demo scenarios script for EMR AI
 * Creates specific demo scenarios to showcase features
 * Usage: pnpm tsx scripts/demo.ts
 */

console.log('')
console.log('🎬 EMR AI Demo Scenarios')
console.log('========================')
console.log('')

const scenarios = [
  {
    name: 'Morning Triage Demo',
    description: 'Shows the AI-powered morning triage dashboard',
    url: '/triage',
    features: [
      'Patient prioritization by risk level',
      'Critical patient alerts',
      'Quick win suggestions',
      'Deterioration indicators',
    ],
    demoSteps: [
      '1. Navigate to Morning Triage from sidebar',
      '2. View patients sorted by risk (Critical → Low)',
      '3. Click on a critical patient to see risk factors',
      '4. Review Quick Wins for actionable tasks',
      '5. Click "View Chart" to go to patient details',
    ],
  },
  {
    name: 'Discharge Planning Demo',
    description: 'AI-assisted discharge readiness assessment',
    url: '/discharge-planning',
    features: [
      'Readiness scoring (Ready Today, Ready Soon, Not Ready)',
      'Blocking factors identification',
      'Pending tests tracking',
      'Follow-up scheduling',
      'Discharge instructions generation',
    ],
    demoSteps: [
      '1. Navigate to Discharge Planning',
      '2. Filter by readiness status',
      '3. Click on a "Ready Soon" patient',
      '4. Review blocking factors and pending tests',
      '5. Generate discharge instructions',
      '6. Schedule follow-up appointments',
    ],
  },
  {
    name: 'AI Diagnostic Assist Demo',
    description: 'Context-aware diagnostic suggestions',
    url: '/patients/[patientId]',
    features: [
      'Text selection triggers AI analysis',
      'ICD-10 code suggestions with confidence',
      'Supporting evidence from patient data',
      'Differential diagnosis considerations',
    ],
    demoSteps: [
      '1. Open any patient chart',
      '2. Go to the Notes tab',
      '3. Select text describing symptoms',
      '4. AI sidebar shows diagnostic suggestions',
      '5. Review evidence and confidence levels',
      '6. Click to apply suggested codes',
    ],
  },
  {
    name: 'Billing Optimization Demo',
    description: 'CMI optimization with compliance safeguards',
    url: '/patients/[patientId]',
    features: [
      'Missing documentation alerts',
      'Code optimization suggestions',
      'Compliance warnings',
      'CMI impact estimates',
    ],
    demoSteps: [
      '1. Open a patient chart',
      '2. Click the Billing tab',
      '3. Review suggested codes',
      '4. See documentation improvement tips',
      '5. Check compliance warnings',
    ],
  },
  {
    name: 'Telemedicine Demo',
    description: 'HIPAA-compliant video visits',
    url: '/telemedicine',
    features: [
      'Secure video calls via Jitsi',
      'Waiting room queue',
      'AI clinical assistant during calls',
      'Patient summary and suggestions',
    ],
    demoSteps: [
      '1. Navigate to Telemedicine',
      '2. View waiting room queue',
      '3. Click on a patient to start session',
      '4. Review AI-generated patient summary',
      '5. Start video call',
      '6. Use AI assistant for clinical suggestions',
    ],
  },
  {
    name: 'Appointments Demo',
    description: 'Scheduling and appointment management',
    url: '/appointments',
    features: [
      'Calendar and list views',
      'Quick appointment creation',
      'Telemedicine scheduling',
      'AI scheduling suggestions',
    ],
    demoSteps: [
      '1. Navigate to Appointments',
      '2. View calendar with appointments',
      '3. Click "New Appointment"',
      '4. Fill in patient and appointment details',
      '5. Review AI optimization suggestions',
    ],
  },
  {
    name: 'Form Builder Demo',
    description: 'Clinical questionnaire creation',
    url: '/admin/forms',
    features: [
      'AI-generated form templates',
      'Drag-and-drop form building',
      'Form preview and testing',
      'Patient data intake',
    ],
    demoSteps: [
      '1. Navigate to Form Builder',
      '2. Click an AI Form Suggestion (e.g., GAD-7)',
      '3. Form is generated and opens in editor',
      '4. Customize fields as needed',
      '5. Preview and test the form',
      '6. Use "Fill Form" for patient intake',
    ],
  },
]

// Print demo scenarios
for (const scenario of scenarios) {
  console.log(`📋 ${scenario.name}`)
  console.log(`   ${scenario.description}`)
  console.log(`   URL: ${scenario.url}`)
  console.log('')
  console.log('   Features:')
  for (const feature of scenario.features) {
    console.log(`   • ${feature}`)
  }
  console.log('')
  console.log('   Demo Steps:')
  for (const step of scenario.demoSteps) {
    console.log(`   ${step}`)
  }
  console.log('')
  console.log('   ' + '─'.repeat(50))
  console.log('')
}

console.log('========================')
console.log('🎯 Quick Demo Path')
console.log('========================')
console.log('')
console.log('For a 10-minute demo, follow this path:')
console.log('')
console.log('1. Dashboard (/) - Overview of system')
console.log('2. Morning Triage (/triage) - AI prioritization')
console.log('3. Patient Chart (/patients/[id]) - AI diagnostics')
console.log('4. Discharge Planning - AI discharge assessment')
console.log('5. Telemedicine - HIPAA video calls')
console.log('6. Form Builder - AI form generation')
console.log('')
console.log('========================')
console.log('')

// Demo data summary
console.log('📊 Demo Data Summary')
console.log('========================')
console.log('')
console.log('Patients by Discharge Readiness:')
console.log('  • READY_TODAY: 5 patients')
console.log('  • READY_SOON: 10 patients')
console.log('  • NOT_READY: 8 patients')
console.log('')
console.log('Patient Conditions Include:')
console.log('  • CHF Exacerbation')
console.log('  • COPD Exacerbation')
console.log('  • Acute Kidney Injury')
console.log('  • Sepsis')
console.log('  • Stroke')
console.log('  • Hip Fracture Post-Op')
console.log('  • Diabetic Ketoacidosis')
console.log('  • And more...')
console.log('')
console.log('Lab Data:')
console.log('  • Outpatient baseline (60-45 days ago)')
console.log('  • Admission labs (7 days ago)')
console.log('  • Daily inpatient trending')
console.log('  • Cultures and special tests')
console.log('')
console.log('Vitals:')
console.log('  • Hourly trending data')
console.log('  • Realistic improvement patterns')
console.log('')
console.log('========================')
console.log('')
console.log('🚀 Ready for demo!')
console.log('   Start server: pnpm dev --port 3300')
console.log('   Open: http://localhost:3300')
console.log('')
