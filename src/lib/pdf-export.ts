/**
 * PDF Export Utility
 * Generates printable/exportable patient records
 */

export interface PatientSummaryData {
  patient: {
    name: string
    mrn: string
    dob: string
    gender: string
    age: number
  }
  encounter?: {
    admitDate: string
    location: string
    attendingPhysician: string
    diagnosis: string
  }
  problems: Array<{
    code: string
    description: string
    status: string
    onsetDate: string
  }>
  allergies: Array<{
    allergen: string
    reaction: string
    severity: string
  }>
  medications: Array<{
    name: string
    dose: string
    frequency: string
    route: string
  }>
  vitals?: {
    bloodPressure: string
    heartRate: string
    temperature: string
    respiratoryRate: string
    oxygenSaturation: string
    recordedAt: string
  }
  labs?: Array<{
    name: string
    value: string
    unit: string
    flag?: string
    date: string
  }>
}

export interface ExportOptions {
  includeProblems?: boolean
  includeAllergies?: boolean
  includeMedications?: boolean
  includeVitals?: boolean
  includeLabs?: boolean
  includeNotes?: boolean
  format?: 'summary' | 'full' | 'discharge'
}

/**
 * Generate HTML content for printing/PDF export
 */
export function generatePatientSummaryHTML(
  data: PatientSummaryData,
  options: ExportOptions = {}
): string {
  const {
    includeProblems = true,
    includeAllergies = true,
    includeMedications = true,
    includeVitals = true,
    includeLabs = true,
  } = options

  const timestamp = new Date().toLocaleString()

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Patient Summary - ${data.patient.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      font-size: 11px; 
      line-height: 1.4;
      color: #333;
      padding: 20px;
    }
    .header { 
      border-bottom: 2px solid #333; 
      padding-bottom: 10px; 
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
    }
    .header h1 { font-size: 18px; }
    .header .facility { font-size: 14px; color: #666; }
    .patient-banner {
      background: #f5f5f5;
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .patient-banner .name { font-size: 16px; font-weight: bold; }
    .patient-banner .details { display: flex; gap: 20px; margin-top: 5px; }
    .patient-banner .detail { }
    .patient-banner .label { color: #666; font-size: 10px; }
    .section { margin-bottom: 15px; }
    .section-title { 
      font-size: 12px; 
      font-weight: bold; 
      background: #e0e0e0; 
      padding: 5px 10px;
      margin-bottom: 8px;
    }
    .section-content { padding: 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { 
      padding: 4px 8px; 
      text-align: left; 
      border-bottom: 1px solid #ddd; 
    }
    th { background: #f0f0f0; font-weight: bold; }
    .allergy-alert { 
      background: #fee; 
      border: 1px solid #f00; 
      padding: 8px; 
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .allergy-alert .title { color: #c00; font-weight: bold; }
    .status-active { color: #c00; }
    .status-resolved { color: #080; }
    .flag-high { color: #c00; font-weight: bold; }
    .flag-low { color: #00c; font-weight: bold; }
    .footer { 
      margin-top: 20px; 
      padding-top: 10px; 
      border-top: 1px solid #ccc;
      font-size: 9px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Patient Clinical Summary</h1>
      <div class="facility">EMR AI Healthcare System</div>
    </div>
    <div style="text-align: right;">
      <div>Generated: ${timestamp}</div>
      <div>CONFIDENTIAL</div>
    </div>
  </div>

  <div class="patient-banner">
    <div class="name">${data.patient.name}</div>
    <div class="details">
      <div class="detail">
        <div class="label">MRN</div>
        <div>${data.patient.mrn}</div>
      </div>
      <div class="detail">
        <div class="label">DOB</div>
        <div>${data.patient.dob} (${data.patient.age} years)</div>
      </div>
      <div class="detail">
        <div class="label">Gender</div>
        <div>${data.patient.gender}</div>
      </div>
      ${data.encounter ? `
      <div class="detail">
        <div class="label">Location</div>
        <div>${data.encounter.location}</div>
      </div>
      <div class="detail">
        <div class="label">Attending</div>
        <div>${data.encounter.attendingPhysician}</div>
      </div>
      ` : ''}
    </div>
  </div>

  ${includeAllergies && data.allergies.length > 0 ? `
  <div class="allergy-alert">
    <div class="title">⚠️ ALLERGIES</div>
    <div>${data.allergies.map(a => `${a.allergen} (${a.reaction} - ${a.severity})`).join(', ')}</div>
  </div>
  ` : includeAllergies ? `
  <div class="section">
    <div class="section-title">ALLERGIES</div>
    <div class="section-content">No Known Drug Allergies (NKDA)</div>
  </div>
  ` : ''}

  ${includeProblems ? `
  <div class="section">
    <div class="section-title">PROBLEM LIST</div>
    <div class="section-content">
      ${data.problems.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Status</th>
            <th>Onset</th>
          </tr>
        </thead>
        <tbody>
          ${data.problems.map(p => `
          <tr>
            <td>${p.code}</td>
            <td>${p.description}</td>
            <td class="status-${p.status}">${p.status}</td>
            <td>${p.onsetDate}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p>No active problems documented</p>'}
    </div>
  </div>
  ` : ''}

  ${includeMedications ? `
  <div class="section">
    <div class="section-title">CURRENT MEDICATIONS</div>
    <div class="section-content">
      ${data.medications.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dose</th>
            <th>Frequency</th>
            <th>Route</th>
          </tr>
        </thead>
        <tbody>
          ${data.medications.map(m => `
          <tr>
            <td>${m.name}</td>
            <td>${m.dose}</td>
            <td>${m.frequency}</td>
            <td>${m.route}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p>No active medications</p>'}
    </div>
  </div>
  ` : ''}

  ${includeVitals && data.vitals ? `
  <div class="section">
    <div class="section-title">VITAL SIGNS (${data.vitals.recordedAt})</div>
    <div class="section-content">
      <table>
        <tr>
          <th>Blood Pressure</th>
          <th>Heart Rate</th>
          <th>Temperature</th>
          <th>Resp Rate</th>
          <th>O2 Sat</th>
        </tr>
        <tr>
          <td>${data.vitals.bloodPressure}</td>
          <td>${data.vitals.heartRate}</td>
          <td>${data.vitals.temperature}</td>
          <td>${data.vitals.respiratoryRate}</td>
          <td>${data.vitals.oxygenSaturation}</td>
        </tr>
      </table>
    </div>
  </div>
  ` : ''}

  ${includeLabs && data.labs && data.labs.length > 0 ? `
  <div class="section">
    <div class="section-title">RECENT LAB RESULTS</div>
    <div class="section-content">
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Flag</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${data.labs.map(l => `
          <tr>
            <td>${l.name}</td>
            <td>${l.value}</td>
            <td>${l.unit}</td>
            <td class="${l.flag === 'H' ? 'flag-high' : l.flag === 'L' ? 'flag-low' : ''}">${l.flag || '-'}</td>
            <td>${l.date}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div>This document contains Protected Health Information (PHI)</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>
`
}

/**
 * Trigger browser print dialog
 */
export function printPatientSummary(data: PatientSummaryData, options?: ExportOptions): void {
  const html = generatePatientSummaryHTML(data, options)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * Download as HTML file (can be converted to PDF by browser)
 */
export function downloadPatientSummary(
  data: PatientSummaryData,
  options?: ExportOptions
): void {
  const html = generatePatientSummaryHTML(data, options)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `patient-summary-${data.patient.mrn}-${new Date().toISOString().split('T')[0]}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
