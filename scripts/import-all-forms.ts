/**
 * Bulk Import All Forms Script
 * Imports all ~100 forms from LOINC and clinical sources into Aidbox
 */

const AIDBOX_BASE_URL = 'https://aoadhslfxc.edge.aidbox.app'
const AIDBOX_CLIENT_ID = 'emr-api'
const AIDBOX_CLIENT_SECRET = 'emr-secret-123'

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${AIDBOX_CLIENT_ID}:${AIDBOX_CLIENT_SECRET}`).toString('base64')
}

// All LOINC forms from the gallery
const ALL_FORMS: any[] = [
  // Lab Panels
  { id: 'leishmania-ab', url: 'http://loinc.org/q/100109-8', title: 'Leishmania sp Ab IB Pnl Ser IB', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Leishmania Ab Result', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'ua-dipstick-micro', url: 'http://loinc.org/q/57020-0', title: 'UA dipstick W Reflex Micro pnl Ur', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Glucose', type: 'choice', answerOption: [{ valueCoding: { code: 'neg', display: 'Negative' } }, { valueCoding: { code: 'trace', display: 'Trace' } }, { valueCoding: { code: 'pos', display: 'Positive' } }] }, { linkId: '2', text: 'Protein', type: 'choice', answerOption: [{ valueCoding: { code: 'neg', display: 'Negative' } }, { valueCoding: { code: 'trace', display: 'Trace' } }, { valueCoding: { code: 'pos', display: 'Positive' } }] }, { linkId: '3', text: 'Blood', type: 'choice', answerOption: [{ valueCoding: { code: 'neg', display: 'Negative' } }, { valueCoding: { code: 'trace', display: 'Trace' } }, { valueCoding: { code: 'pos', display: 'Positive' } }] }] },
  { id: 'periop-nursing', url: 'http://loinc.org/q/100017-3', title: 'Perioperative nursing data set outcomes panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Skin Integrity Maintained', type: 'boolean' }, { linkId: '2', text: 'Normothermia Maintained', type: 'boolean' }, { linkId: '3', text: 'Fluid Balance Maintained', type: 'boolean' }] },
  { id: 'sdom-panel', url: 'http://loinc.org/q/100062-9', title: 'SDOM panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'SDOM Result', type: 'string' }] },
  { id: 'oa-nb-scn', url: 'http://loinc.org/q/57085-3', title: 'OA NB scn pnl DBS', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Organic Acids Screen', type: 'string' }] },
  { id: 'specular-microscopy', url: 'http://loinc.org/q/100066-0', title: 'Specular microscopy panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Endothelial Cell Density', type: 'decimal' }, { linkId: '2', text: 'Coefficient of Variation', type: 'decimal' }, { linkId: '3', text: 'Hexagonality', type: 'decimal' }] },
  { id: 'cah-nb-scn', url: 'http://loinc.org/q/57086-1', title: 'CAH NB scn pnl DBS', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: '17-OHP', type: 'decimal' }] },
  { id: 't-solium-ab', url: 'http://loinc.org/q/100088-4', title: 'T solium Ab bands Pnl Ser IB', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'T solium Ab Result', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 't-cruzi-ab', url: 'http://loinc.org/q/100092-6', title: 'T cruzi Ab bands Pnl Ser IB', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'T cruzi Ab Result', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'filaria-ab', url: 'http://loinc.org/q/100105-6', title: 'Filaria Ab.IgG + IgM Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Filaria IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }, { linkId: '2', text: 'Filaria IgM', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'fasciola-ab', url: 'http://loinc.org/q/100112-2', title: 'Fasciola sp Ab IB Pnl Ser IB', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Fasciola Ab Result', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'h-pylori-ab', url: 'http://loinc.org/q/100113-0', title: 'H pylori Ab Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'H pylori IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }, { linkId: '2', text: 'H pylori IgA', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'c-trachomatis-ab', url: 'http://loinc.org/q/100120-5', title: 'C trachomatis Ab Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Chlamydia IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'rmns-nerve', url: 'http://loinc.org/q/98706-5', title: 'RMNS Pnl Nerve', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Nerve Conduction Result', type: 'string' }] },
  { id: 'c-pneum-ab', url: 'http://loinc.org/q/100122-1', title: 'C pneum Ab Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'C pneumoniae IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'c-psittaci-ab', url: 'http://loinc.org/q/100125-4', title: 'C psittaci Ab Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'C psittaci IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'b-pert-igg', url: 'http://loinc.org/q/100126-2', title: 'B pert IgG Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Pertussis IgG', type: 'decimal' }] },
  { id: 'wnv-ab', url: 'http://loinc.org/q/55402-2', title: 'WNV IgG+IgM Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'West Nile IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }, { linkId: '2', text: 'West Nile IgM', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'campylobacter-ab', url: 'http://loinc.org/q/100127-0', title: 'Campylobacter sp Ab Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Campylobacter Ab', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'cryptoc-ag', url: 'http://loinc.org/q/100128-8', title: 'Cryptoc Ag Pnl Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Cryptococcal Antigen', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 't-gondii-ab', url: 'http://loinc.org/q/100147-8', title: 'T gondii Ab bands Pnl Ser IB', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Toxoplasma IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }, { linkId: '2', text: 'Toxoplasma IgM', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'schistosoma-ab', url: 'http://loinc.org/q/100148-6', title: 'Schistosoma sp Ab IB Pnl Ser IB', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Schistosoma Ab', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'oxo-pip', url: 'http://loinc.org/q/100149-4', title: '6-oxo-PIP + 6(R+S)-OPP Ur+SerPl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: '6-oxo-PIP Level', type: 'decimal' }] },
  
  // Orthopedic Assessments
  { id: 'knee-society-preop', url: 'http://loinc.org/q/100159-3', title: 'Knee Society Score pre-op panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Pain Score', type: 'integer' }, { linkId: '2', text: 'Range of Motion', type: 'integer' }, { linkId: '3', text: 'Stability', type: 'integer' }, { linkId: '4', text: 'Walking Distance', type: 'choice', answerOption: [{ valueCoding: { code: 'unlimited', display: 'Unlimited' } }, { valueCoding: { code: 'blocks', display: '5-10 blocks' } }, { valueCoding: { code: 'indoor', display: 'Indoor only' } }] }] },
  { id: 'knee-society-postop', url: 'http://loinc.org/q/100203-9', title: 'Knee Society Score post-op panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Pain Score', type: 'integer' }, { linkId: '2', text: 'Range of Motion', type: 'integer' }, { linkId: '3', text: 'Stability', type: 'integer' }, { linkId: '4', text: 'Walking Distance', type: 'choice', answerOption: [{ valueCoding: { code: 'unlimited', display: 'Unlimited' } }, { valueCoding: { code: 'blocks', display: '5-10 blocks' } }, { valueCoding: { code: 'indoor', display: 'Indoor only' } }] }] },
  { id: 'harris-hip', url: 'http://loinc.org/q/100283-1', title: 'Harris Hip Score panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Pain', type: 'choice', answerOption: [{ valueCoding: { code: 'none', display: 'None' } }, { valueCoding: { code: 'slight', display: 'Slight' } }, { valueCoding: { code: 'mild', display: 'Mild' } }, { valueCoding: { code: 'moderate', display: 'Moderate' } }, { valueCoding: { code: 'severe', display: 'Severe' } }] }, { linkId: '2', text: 'Limp', type: 'choice', answerOption: [{ valueCoding: { code: 'none', display: 'None' } }, { valueCoding: { code: 'slight', display: 'Slight' } }, { valueCoding: { code: 'moderate', display: 'Moderate' } }, { valueCoding: { code: 'severe', display: 'Severe' } }] }, { linkId: '3', text: 'Walking Distance', type: 'choice', answerOption: [{ valueCoding: { code: 'unlimited', display: 'Unlimited' } }, { valueCoding: { code: '6blocks', display: '6 blocks' } }, { valueCoding: { code: '2blocks', display: '2-3 blocks' } }, { valueCoding: { code: 'indoor', display: 'Indoor only' } }] }] },
  
  // Cardiac
  { id: 'cardiac-lv-swm', url: 'http://loinc.org/q/100224-5', title: 'Cardiac LV SWM Pnl LV US', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Ejection Fraction (%)', type: 'decimal' }, { linkId: '2', text: 'Wall Motion', type: 'choice', answerOption: [{ valueCoding: { code: 'normal', display: 'Normal' } }, { valueCoding: { code: 'hypokinetic', display: 'Hypokinetic' } }, { valueCoding: { code: 'akinetic', display: 'Akinetic' } }] }] },
  
  // Metabolic
  { id: 'leukotriene-e4', url: 'http://loinc.org/q/101681-5', title: 'Leukotriene E4, Rnd, Urine', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Leukotriene E4 Level', type: 'decimal' }] },
  
  // Screening Tools
  { id: 'behavioral-elder', url: 'http://loinc.org/q/100307-8', title: 'Behavioral screening elder mistreatment', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Fear of caregiver', type: 'boolean' }, { linkId: '2', text: 'Left alone for long periods', type: 'boolean' }, { linkId: '3', text: 'Unexplained injuries', type: 'boolean' }, { linkId: '4', text: 'Money taken without permission', type: 'boolean' }] },
  { id: 'norwalk-screening', url: 'http://loinc.org/q/100353-2', title: 'Norwalk Community Health Center Screening Tool', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Housing Stability', type: 'choice', answerOption: [{ valueCoding: { code: 'stable', display: 'Stable' } }, { valueCoding: { code: 'atrisk', display: 'At Risk' } }, { valueCoding: { code: 'unstable', display: 'Unstable' } }] }, { linkId: '2', text: 'Food Security', type: 'choice', answerOption: [{ valueCoding: { code: 'secure', display: 'Secure' } }, { valueCoding: { code: 'insecure', display: 'Insecure' } }] }] },
  { id: 'brief-resilience', url: 'http://loinc.org/q/100360-7', title: 'Brief Resilience Scale Panel (BRS)', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'I tend to bounce back quickly after hard times', type: 'choice', answerOption: [{ valueCoding: { code: '1', display: 'Strongly Disagree' } }, { valueCoding: { code: '2', display: 'Disagree' } }, { valueCoding: { code: '3', display: 'Neutral' } }, { valueCoding: { code: '4', display: 'Agree' } }, { valueCoding: { code: '5', display: 'Strongly Agree' } }] }, { linkId: '2', text: 'I have a hard time making it through stressful events', type: 'choice', answerOption: [{ valueCoding: { code: '1', display: 'Strongly Disagree' } }, { valueCoding: { code: '2', display: 'Disagree' } }, { valueCoding: { code: '3', display: 'Neutral' } }, { valueCoding: { code: '4', display: 'Agree' } }, { valueCoding: { code: '5', display: 'Strongly Agree' } }] }] },
  
  // Audiology
  { id: 'pure-tone-bone', url: 'http://loinc.org/q/100652-7', title: 'Pure tone bone thresh Pnl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: '250 Hz Right', type: 'integer' }, { linkId: '2', text: '500 Hz Right', type: 'integer' }, { linkId: '3', text: '1000 Hz Right', type: 'integer' }, { linkId: '4', text: '2000 Hz Right', type: 'integer' }, { linkId: '5', text: '4000 Hz Right', type: 'integer' }] },
  { id: 'pure-tone-air', url: 'http://loinc.org/q/100653-5', title: 'Pure tone air thresh Pnl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: '250 Hz Right', type: 'integer' }, { linkId: '2', text: '500 Hz Right', type: 'integer' }, { linkId: '3', text: '1000 Hz Right', type: 'integer' }, { linkId: '4', text: '2000 Hz Right', type: 'integer' }, { linkId: '5', text: '4000 Hz Right', type: 'integer' }] },
  
  // Microbiology
  { id: 'gi-parasitic', url: 'http://loinc.org/q/92697-2', title: 'GI parasitic pathogens Pnl Stl NAA+probe', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Giardia', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }, { linkId: '2', text: 'Cryptosporidium', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }, { linkId: '3', text: 'E. histolytica', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }] },
  { id: 'c-trach-gc', url: 'http://loinc.org/q/100710-3', title: 'C trach+GC pnl Throat NAA+probe', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Chlamydia trachomatis', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }, { linkId: '2', text: 'Neisseria gonorrhoeae', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }] },
  { id: 'enterobac-carb', url: 'http://loinc.org/q/100900-0', title: 'Enterobac Carb Resis Pnl Anal Cult', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'CRE Screen', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'candida-id', url: 'http://loinc.org/q/100903-4', title: 'Yst+Candida sp ID Pnl Spec Cult', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Organism Identified', type: 'string' }] },
  { id: 'enterob-esbl-vre', url: 'http://loinc.org/q/100912-5', title: 'Enterob ESBL & VRE panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'ESBL Screen', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }, { linkId: '2', text: 'VRE Screen', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'mrsa-screen', url: 'http://loinc.org/q/100913-3', title: 'S. aureus+MRSA screen Pnl Spec Cult', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'S. aureus', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }, { linkId: '2', text: 'MRSA', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  
  // Allergy
  { id: 'meat-allergen', url: 'http://loinc.org/q/100751-7', title: 'Meat allergen panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Alpha-gal IgE', type: 'decimal' }, { linkId: '2', text: 'Beef IgE', type: 'decimal' }, { linkId: '3', text: 'Pork IgE', type: 'decimal' }, { linkId: '4', text: 'Lamb IgE', type: 'decimal' }] },
  { id: 'resp-allergen', url: 'http://loinc.org/q/100997-6', title: 'Respiratory Allergen Panel, Area 5 Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Dust Mite IgE', type: 'decimal' }, { linkId: '2', text: 'Cat Dander IgE', type: 'decimal' }, { linkId: '3', text: 'Dog Dander IgE', type: 'decimal' }, { linkId: '4', text: 'Grass Pollen IgE', type: 'decimal' }] },
  
  // Neurology
  { id: 'oligoclonal-bands', url: 'http://loinc.org/q/100757-4', title: 'Oligoclonal Bands panel Ser+CSF IEF', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'CSF Bands', type: 'integer' }, { linkId: '2', text: 'Serum Bands', type: 'integer' }, { linkId: '3', text: 'Interpretation', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Pattern Positive' } }, { valueCoding: { code: 'neg', display: 'Pattern Negative' } }] }] },
  
  // Immunology
  { id: 'lrba-deficiency', url: 'http://loinc.org/q/100429-0', title: 'LRBA deficiency panel Bld', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'LRBA Protein Expression', type: 'choice', answerOption: [{ valueCoding: { code: 'normal', display: 'Normal' } }, { valueCoding: { code: 'reduced', display: 'Reduced' } }, { valueCoding: { code: 'absent', display: 'Absent' } }] }] },
  { id: 'lymph-subsets-csf', url: 'http://loinc.org/q/100987-7', title: 'Lymph Tcell+Bcell+NK subsets Pnl CSF', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'CD3+ T cells (%)', type: 'decimal' }, { linkId: '2', text: 'CD4+ T cells (%)', type: 'decimal' }, { linkId: '3', text: 'CD8+ T cells (%)', type: 'decimal' }, { linkId: '4', text: 'CD19+ B cells (%)', type: 'decimal' }, { linkId: '5', text: 'NK cells (%)', type: 'decimal' }] },
  { id: 'monocyte-subsets', url: 'http://loinc.org/q/101146-9', title: 'Monocyte subsets panel Bld FC', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Classical Monocytes (%)', type: 'decimal' }, { linkId: '2', text: 'Intermediate Monocytes (%)', type: 'decimal' }, { linkId: '3', text: 'Non-classical Monocytes (%)', type: 'decimal' }] },
  
  // Virology
  { id: 'orthopox-ab', url: 'http://loinc.org/q/100893-7', title: 'Orthopoxvirus IgG + IgM Ab panel SerPl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Orthopoxvirus IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }, { linkId: '2', text: 'Orthopoxvirus IgM', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'hantavirus-igg', url: 'http://loinc.org/q/101209-5', title: 'Hantavirus IgG panel SerPl Line blot', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Hantavirus IgG', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'hantavirus-igm', url: 'http://loinc.org/q/101214-5', title: 'Hantavirus IgM panel SerPl Line blot', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Hantavirus IgM', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] }] },
  { id: 'flu-sars-cov2', url: 'http://loinc.org/q/100972-9', title: 'FLUABV+SARS-CoV2 RNA Pnl Nose NAA+nonprb', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Influenza A', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }, { linkId: '2', text: 'Influenza B', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }, { linkId: '3', text: 'SARS-CoV-2', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }] },
  
  // Endocrine
  { id: 'cortisol-insulin', url: 'http://loinc.org/q/100998-4', title: 'Cortisol post dose insulin IV pnl SerPl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Baseline Cortisol', type: 'decimal' }, { linkId: '2', text: '30 min Cortisol', type: 'decimal' }, { linkId: '3', text: '60 min Cortisol', type: 'decimal' }, { linkId: '4', text: '90 min Cortisol', type: 'decimal' }] },
  { id: 'gh-insulin', url: 'http://loinc.org/q/100999-2', title: 'GH post dose insulin IV pnl SerPl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Baseline GH', type: 'decimal' }, { linkId: '2', text: '30 min GH', type: 'decimal' }, { linkId: '3', text: '60 min GH', type: 'decimal' }, { linkId: '4', text: '90 min GH', type: 'decimal' }] },
  { id: 'glucose-challenge', url: 'http://loinc.org/q/101132-9', title: 'Glucose post XXX challenge pnl SerPl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Fasting Glucose', type: 'decimal' }, { linkId: '2', text: '1 hour Glucose', type: 'decimal' }, { linkId: '3', text: '2 hour Glucose', type: 'decimal' }] },
  
  // STI
  { id: 'ct-ng-tv', url: 'http://loinc.org/q/101172-5', title: 'CT + NG + TV rRNA Pnl Spec NAA+probe', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Chlamydia trachomatis', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }, { linkId: '2', text: 'Neisseria gonorrhoeae', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }, { linkId: '3', text: 'Trichomonas vaginalis', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] }] },
  
  // Genetic
  { id: 'mvpx-sequencing', url: 'http://loinc.org/q/101002-4', title: 'MVPX sequencing panel Spec Seq', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Sequence Result', type: 'string' }] },
  
  // Digital Health
  { id: 'user-satisfaction', url: 'http://loinc.org/q/100921-6', title: 'User satisfaction panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Overall Satisfaction', type: 'choice', answerOption: [{ valueCoding: { code: '1', display: 'Very Dissatisfied' } }, { valueCoding: { code: '2', display: 'Dissatisfied' } }, { valueCoding: { code: '3', display: 'Neutral' } }, { valueCoding: { code: '4', display: 'Satisfied' } }, { valueCoding: { code: '5', display: 'Very Satisfied' } }] }] },
  { id: 'privacy-panel', url: 'http://loinc.org/q/100922-4', title: 'Privacy panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Privacy Concerns', type: 'choice', answerOption: [{ valueCoding: { code: 'none', display: 'No concerns' } }, { valueCoding: { code: 'some', display: 'Some concerns' } }, { valueCoding: { code: 'major', display: 'Major concerns' } }] }] },
  { id: 'digital-confidence', url: 'http://loinc.org/q/100928-1', title: 'Digital confidence panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Confidence using digital devices', type: 'choice', answerOption: [{ valueCoding: { code: '1', display: 'Not confident' } }, { valueCoding: { code: '2', display: 'Somewhat confident' } }, { valueCoding: { code: '3', display: 'Confident' } }, { valueCoding: { code: '4', display: 'Very confident' } }] }] },
  { id: 'personal-safety', url: 'http://loinc.org/q/100934-9', title: 'Personal safety panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Feel safe at home', type: 'boolean' }, { linkId: '2', text: 'Feel safe in neighborhood', type: 'boolean' }] },
  { id: 'neighbor-relationships', url: 'http://loinc.org/q/100940-6', title: 'Neighbor relationships panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Know neighbors', type: 'boolean' }, { linkId: '2', text: 'Trust neighbors', type: 'boolean' }] },
  { id: 'loneliness-ons', url: 'http://loinc.org/q/100951-3', title: 'Loneliness Office of National Statistics panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'How often do you feel lonely?', type: 'choice', answerOption: [{ valueCoding: { code: 'often', display: 'Often/Always' } }, { valueCoding: { code: 'some', display: 'Some of the time' } }, { valueCoding: { code: 'hardly', display: 'Hardly ever' } }, { valueCoding: { code: 'never', display: 'Never' } }] }] },
  { id: 'product-confidence', url: 'http://loinc.org/q/100952-1', title: 'Product confidence panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Confidence in product', type: 'choice', answerOption: [{ valueCoding: { code: '1', display: 'Not confident' } }, { valueCoding: { code: '2', display: 'Somewhat confident' } }, { valueCoding: { code: '3', display: 'Confident' } }, { valueCoding: { code: '4', display: 'Very confident' } }] }] },
  { id: 'digital-readiness', url: 'http://loinc.org/q/100958-8', title: 'Digital readiness panel', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Internet access at home', type: 'boolean' }, { linkId: '2', text: 'Has smartphone', type: 'boolean' }, { linkId: '3', text: 'Uses email', type: 'boolean' }] },
  
  // Veterinary/Public Health
  { id: 'bovine-tub', url: 'http://loinc.org/q/100968-7', title: 'Bovine Tub comp cervical tst panel Skin', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Injection Site Reaction', type: 'decimal' }] },
  { id: 'febrile-antibody', url: 'http://loinc.org/q/100866-3', title: 'Febrile antibody profile Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Brucella Ab', type: 'string' }, { linkId: '2', text: 'Salmonella O Ab', type: 'string' }, { linkId: '3', text: 'Proteus OX-19', type: 'string' }] },
  
  // Anthropometry
  { id: 'standing-height', url: 'http://loinc.org/q/62294-4', title: 'PhenX - standing height', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Height (cm)', type: 'decimal' }] },
  { id: 'recumbent-length', url: 'http://loinc.org/q/62295-1', title: 'Recumbent length proto', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Recumbent Length (cm)', type: 'decimal' }] },
  { id: 'self-reported-height', url: 'http://loinc.org/q/62296-9', title: 'Self reported height proto', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Self-reported Height (cm)', type: 'decimal' }] },
  
  // MDS Nursing Home Assessments
  { id: 'mds-nc', url: 'http://loinc.org/q/101105-5', title: 'MDS v3.0 - Nursing home comprehensive (NC) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Assessment Reference Date', type: 'date' }, { linkId: '2', text: 'Cognitive Patterns', type: 'group', item: [{ linkId: '2.1', text: 'Short-term Memory', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Memory OK' } }, { valueCoding: { code: '1', display: 'Memory problem' } }] }] }] },
  { id: 'mds-nq', url: 'http://loinc.org/q/101106-3', title: 'MDS v3.0 - Nursing home quarterly (NQ) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Assessment Reference Date', type: 'date' }] },
  { id: 'mds-nd', url: 'http://loinc.org/q/101107-1', title: 'MDS v3.0 - Nursing home discharge (ND) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Discharge Date', type: 'date' }, { linkId: '2', text: 'Discharge Destination', type: 'string' }] },
  { id: 'mds-nt-st', url: 'http://loinc.org/q/101108-9', title: 'MDS v3.0 - Nursing home & Swing bed tracking (NT & ST) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Tracking Reference Date', type: 'date' }] },
  { id: 'mds-npe', url: 'http://loinc.org/q/101109-7', title: 'MDS v3.0 - Nursing home part A PPS discharge (NPE) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Discharge Date', type: 'date' }] },
  { id: 'mds-np', url: 'http://loinc.org/q/101110-5', title: 'MDS v3.0 - Nursing home PPS (NP) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Assessment Reference Date', type: 'date' }] },
  { id: 'mds-ipa', url: 'http://loinc.org/q/101111-3', title: 'MDS v3.0 - Interim Payment Assessment (IPA) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Assessment Reference Date', type: 'date' }] },
  { id: 'mds-sp', url: 'http://loinc.org/q/101112-1', title: 'MDS v3.0 - Swing bed PPS (SP) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Assessment Reference Date', type: 'date' }] },
  { id: 'mds-sd', url: 'http://loinc.org/q/101113-9', title: 'MDS v3.0 - Swing bed discharge (SD) item set', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Discharge Date', type: 'date' }] },
  
  // Pharyngeal
  { id: 'pharyngeal-path', url: 'http://loinc.org/q/101285-5', title: 'Pharyngeal path Pnl Non-probe', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Organism', type: 'string' }] },
  
  // Misc Lab
  { id: 'cell-cnt-amn', url: 'http://loinc.org/q/100848-1', title: 'Cell Cnt + Diff Pnl Amn Manual', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'WBC Count', type: 'integer' }, { linkId: '2', text: 'RBC Count', type: 'integer' }] },
  { id: 'blda', url: 'http://loinc.org/q/100847-3', title: 'BldA', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Blood A Result', type: 'string' }] },
  { id: 'bld-fc', url: 'http://loinc.org/q/100994-3', title: 'Bld FC', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Flow Cytometry Result', type: 'string' }] },
  { id: 'lpald-ser', url: 'http://loinc.org/q/100732-7', title: 'LPALD Ser', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'LPALD Level', type: 'decimal' }] },
  { id: 'ur-cfm', url: 'http://loinc.org/q/100734-3', title: 'Ur Cfm', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Urine Confirmation', type: 'string' }] },
  { id: 'aaucd-serpl', url: 'http://loinc.org/q/100368-0', title: 'AAUCD SerPl LC/MS/MS', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'AAUCD Level', type: 'decimal' }] },
  { id: 'corto-serpl', url: 'http://loinc.org/q/100662-6', title: 'CORTO SerPl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'CORTO Level', type: 'decimal' }] },
  { id: 'lp-sg', url: 'http://loinc.org/q/100747-5', title: 'Lp-SG panel Spec', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Lp-SG Result', type: 'string' }] },
  { id: 'hcys-malonate', url: 'http://loinc.org/q/100765-7', title: 'Hcys+Me-Malonate+2Me-citrate Pnl DBS', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Homocysteine', type: 'decimal' }, { linkId: '2', text: 'Methylmalonate', type: 'decimal' }] },
  { id: 'm6pi-pmm1', url: 'http://loinc.org/q/100735-0', title: 'M6PI & PMM1 panel WBC', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'M6PI Activity', type: 'decimal' }, { linkId: '2', text: 'PMM1 Activity', type: 'decimal' }] },
  { id: 'ustek-panel', url: 'http://loinc.org/q/101144-4', title: 'USTEK panel SerPl', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Ustekinumab Level', type: 'decimal' }] },
  { id: 'time-start-end', url: 'http://loinc.org/q/100302-9', title: 'Time start/end panel Spec', publisher: 'Regenstrief Institute, Inc.', item: [{ linkId: '1', text: 'Start Time', type: 'dateTime' }, { linkId: '2', text: 'End Time', type: 'dateTime' }] },
]

async function importForms() {
  console.log('Starting bulk import of forms...')
  const results = { imported: [] as string[], failed: [] as any[], total: 0 }

  for (const form of ALL_FORMS) {
    const questionnaire = {
      resourceType: 'Questionnaire',
      id: form.id,
      url: form.url,
      title: form.title,
      status: 'active',
      publisher: form.publisher,
      subjectType: ['Patient'],
      item: form.item,
    }

    try {
      const response = await fetch(`${AIDBOX_BASE_URL}/Questionnaire/${form.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionnaire),
      })

      if (response.ok) {
        results.imported.push(form.title)
        console.log(`✓ Imported: ${form.title}`)
      } else {
        const error = await response.text()
        results.failed.push({ id: form.id, error })
        console.log(`✗ Failed: ${form.title} - ${error}`)
      }
    } catch (error: any) {
      results.failed.push({ id: form.id, error: error.message })
      console.log(`✗ Error: ${form.title} - ${error.message}`)
    }
  }

  results.total = results.imported.length + results.failed.length
  console.log(`\nImport complete: ${results.imported.length} succeeded, ${results.failed.length} failed`)
  return results
}

importForms().then(console.log).catch(console.error)
