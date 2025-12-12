/**
 * Drug Interaction Checker
 * Checks for drug-drug and drug-allergy interactions
 */

export interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated'
  description: string
  clinicalEffect: string
  recommendation: string
}

export interface DrugAllergyAlert {
  drug: string
  allergen: string
  crossReactivity: boolean
  severity: 'warning' | 'danger'
  description: string
  recommendation: string
}

export interface InteractionCheckResult {
  hasInteractions: boolean
  hasSevereInteractions: boolean
  hasAllergyAlerts: boolean
  drugInteractions: DrugInteraction[]
  allergyAlerts: DrugAllergyAlert[]
  timestamp: string
}

// Common drug-drug interactions database (simplified for demo)
const drugInteractionsDB: DrugInteraction[] = [
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'major',
    description: 'Increased risk of bleeding',
    clinicalEffect: 'Combined use significantly increases the risk of gastrointestinal and other bleeding.',
    recommendation: 'Monitor closely for signs of bleeding. Consider alternative antiplatelet if possible.',
  },
  {
    drug1: 'warfarin',
    drug2: 'ibuprofen',
    severity: 'major',
    description: 'Increased anticoagulant effect and bleeding risk',
    clinicalEffect: 'NSAIDs can increase INR and risk of GI bleeding.',
    recommendation: 'Avoid combination. Use acetaminophen for pain if possible.',
  },
  {
    drug1: 'lisinopril',
    drug2: 'potassium',
    severity: 'moderate',
    description: 'Risk of hyperkalemia',
    clinicalEffect: 'ACE inhibitors reduce potassium excretion; supplementation may cause dangerous levels.',
    recommendation: 'Monitor potassium levels closely. Avoid potassium supplements unless hypokalemic.',
  },
  {
    drug1: 'lisinopril',
    drug2: 'spironolactone',
    severity: 'major',
    description: 'Severe hyperkalemia risk',
    clinicalEffect: 'Both drugs increase potassium levels; combination greatly increases hyperkalemia risk.',
    recommendation: 'If combination necessary, monitor potassium frequently.',
  },
  {
    drug1: 'metformin',
    drug2: 'contrast dye',
    severity: 'major',
    description: 'Risk of lactic acidosis',
    clinicalEffect: 'IV contrast can cause acute kidney injury, impairing metformin clearance.',
    recommendation: 'Hold metformin 48 hours before and after contrast administration.',
  },
  {
    drug1: 'simvastatin',
    drug2: 'amiodarone',
    severity: 'major',
    description: 'Increased risk of myopathy/rhabdomyolysis',
    clinicalEffect: 'Amiodarone inhibits statin metabolism, increasing toxicity risk.',
    recommendation: 'Limit simvastatin to 20mg daily or switch to pravastatin.',
  },
  {
    drug1: 'clopidogrel',
    drug2: 'omeprazole',
    severity: 'moderate',
    description: 'Reduced antiplatelet effect',
    clinicalEffect: 'Omeprazole inhibits CYP2C19, reducing clopidogrel activation.',
    recommendation: 'Use pantoprazole instead if PPI needed.',
  },
  {
    drug1: 'fluoxetine',
    drug2: 'tramadol',
    severity: 'major',
    description: 'Serotonin syndrome risk',
    clinicalEffect: 'Combined serotonergic activity can cause dangerous syndrome.',
    recommendation: 'Avoid combination. Consider alternative analgesic.',
  },
  {
    drug1: 'ciprofloxacin',
    drug2: 'tizanidine',
    severity: 'contraindicated',
    description: 'Severe hypotension and sedation',
    clinicalEffect: 'Ciprofloxacin dramatically increases tizanidine levels.',
    recommendation: 'Contraindicated. Do not use together.',
  },
  {
    drug1: 'methotrexate',
    drug2: 'trimethoprim',
    severity: 'major',
    description: 'Severe bone marrow suppression',
    clinicalEffect: 'Both are folate antagonists; combined effect on bone marrow.',
    recommendation: 'Avoid combination. Use alternative antibiotic.',
  },
  {
    drug1: 'digoxin',
    drug2: 'amiodarone',
    severity: 'major',
    description: 'Digoxin toxicity',
    clinicalEffect: 'Amiodarone increases digoxin levels by 70-100%.',
    recommendation: 'Reduce digoxin dose by 50% when starting amiodarone.',
  },
  {
    drug1: 'lithium',
    drug2: 'ibuprofen',
    severity: 'major',
    description: 'Lithium toxicity',
    clinicalEffect: 'NSAIDs reduce lithium clearance, increasing levels.',
    recommendation: 'Monitor lithium levels. Use acetaminophen instead.',
  },
]

// Cross-reactivity database for allergies
const crossReactivityDB: Array<{
  allergen: string
  crossReactive: string[]
  description: string
}> = [
  {
    allergen: 'penicillin',
    crossReactive: ['amoxicillin', 'ampicillin', 'piperacillin', 'cephalosporins'],
    description: 'Beta-lactam antibiotics share similar structure',
  },
  {
    allergen: 'sulfa',
    crossReactive: ['sulfamethoxazole', 'sulfasalazine', 'furosemide', 'thiazides'],
    description: 'Sulfonamide-containing medications may cross-react',
  },
  {
    allergen: 'aspirin',
    crossReactive: ['ibuprofen', 'naproxen', 'ketorolac', 'nsaids'],
    description: 'Cross-sensitivity among NSAIDs is common',
  },
  {
    allergen: 'codeine',
    crossReactive: ['morphine', 'hydrocodone', 'oxycodone', 'tramadol'],
    description: 'Opioid cross-reactivity possible',
  },
  {
    allergen: 'latex',
    crossReactive: ['banana', 'avocado', 'kiwi', 'chestnut'],
    description: 'Latex-fruit syndrome cross-reactivity',
  },
]

/**
 * Normalize drug name for comparison
 */
function normalizeDrugName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Check if two drug names match (including partial matches)
 */
function drugsMatch(drug1: string, drug2: string): boolean {
  const n1 = normalizeDrugName(drug1)
  const n2 = normalizeDrugName(drug2)
  return n1.includes(n2) || n2.includes(n1) || n1 === n2
}

/**
 * Check for drug-drug interactions
 */
export function checkDrugDrugInteractions(medications: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = []
  const normalizedMeds = medications.map(normalizeDrugName)

  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      const med1 = normalizedMeds[i]
      const med2 = normalizedMeds[j]

      for (const interaction of drugInteractionsDB) {
        const drug1Match = drugsMatch(med1, interaction.drug1) || drugsMatch(med1, interaction.drug2)
        const drug2Match = drugsMatch(med2, interaction.drug1) || drugsMatch(med2, interaction.drug2)

        if (drug1Match && drug2Match && med1 !== med2) {
          interactions.push({
            ...interaction,
            drug1: medications[i],
            drug2: medications[j],
          })
        }
      }
    }
  }

  return interactions
}

/**
 * Check for drug-allergy interactions
 */
export function checkDrugAllergyInteractions(
  medications: string[],
  allergies: Array<{ allergen: string; severity: string }>
): DrugAllergyAlert[] {
  const alerts: DrugAllergyAlert[] = []

  for (const med of medications) {
    const normalizedMed = normalizeDrugName(med)

    for (const allergy of allergies) {
      const normalizedAllergen = normalizeDrugName(allergy.allergen)

      // Direct match
      if (drugsMatch(normalizedMed, normalizedAllergen)) {
        alerts.push({
          drug: med,
          allergen: allergy.allergen,
          crossReactivity: false,
          severity: 'danger',
          description: `Patient has documented allergy to ${allergy.allergen}`,
          recommendation: 'Do not administer. Select alternative medication.',
        })
        continue
      }

      // Check cross-reactivity
      for (const crossReact of crossReactivityDB) {
        if (drugsMatch(normalizedAllergen, crossReact.allergen)) {
          for (const reactive of crossReact.crossReactive) {
            if (drugsMatch(normalizedMed, reactive)) {
              alerts.push({
                drug: med,
                allergen: allergy.allergen,
                crossReactivity: true,
                severity: 'warning',
                description: `Potential cross-reactivity: ${crossReact.description}`,
                recommendation: 'Use with caution. Monitor for allergic reaction.',
              })
            }
          }
        }
      }
    }
  }

  return alerts
}

/**
 * Comprehensive interaction check
 */
export function checkAllInteractions(
  medications: string[],
  allergies: Array<{ allergen: string; severity: string }>
): InteractionCheckResult {
  const drugInteractions = checkDrugDrugInteractions(medications)
  const allergyAlerts = checkDrugAllergyInteractions(medications, allergies)

  const hasSevereInteractions = drugInteractions.some(
    (i) => i.severity === 'major' || i.severity === 'contraindicated'
  )

  return {
    hasInteractions: drugInteractions.length > 0,
    hasSevereInteractions,
    hasAllergyAlerts: allergyAlerts.length > 0,
    drugInteractions,
    allergyAlerts,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'contraindicated':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'major':
    case 'danger':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'moderate':
    case 'warning':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'minor':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}
