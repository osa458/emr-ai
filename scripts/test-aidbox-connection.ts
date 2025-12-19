/**
 * Test Aidbox Connection
 * Run with: npx tsx scripts/test-aidbox-connection.ts
 */

import 'dotenv/config';

const AIDBOX_BASE_URL = process.env.AIDBOX_BASE_URL;
const AIDBOX_CLIENT_ID = process.env.AIDBOX_CLIENT_ID;
const AIDBOX_CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET;

console.log('=== Aidbox Connection Test ===\n');
console.log('Configuration:');
console.log(`  URL: ${AIDBOX_BASE_URL}`);
console.log(`  Client ID: ${AIDBOX_CLIENT_ID}`);
console.log(`  Secret length: ${AIDBOX_CLIENT_SECRET?.length || 0} chars`);
console.log(`  Secret preview: ${AIDBOX_CLIENT_SECRET?.substring(0, 20)}...`);
console.log('');

async function testConnection() {
  if (!AIDBOX_BASE_URL || !AIDBOX_CLIENT_ID || !AIDBOX_CLIENT_SECRET) {
    console.error('❌ Missing environment variables');
    return;
  }

  // Test 1: Basic auth to metadata endpoint (no auth required usually)
  console.log('Test 1: Fetching FHIR metadata (no auth)...');
  try {
    const metaRes = await fetch(`${AIDBOX_BASE_URL}/fhir/metadata`);
    if (metaRes.ok) {
      console.log('✅ Metadata endpoint accessible');
    } else {
      console.log(`⚠️  Metadata returned ${metaRes.status}: ${metaRes.statusText}`);
    }
  } catch (err) {
    console.log(`❌ Metadata fetch failed: ${err}`);
  }

  // Test 2: Basic auth to Patient endpoint
  console.log('\nTest 2: Fetching Patients with Basic Auth...');
  const credentials = Buffer.from(`${AIDBOX_CLIENT_ID}:${AIDBOX_CLIENT_SECRET}`).toString('base64');
  
  try {
    const patientRes = await fetch(`${AIDBOX_BASE_URL}/fhir/Patient?_count=1`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`  Status: ${patientRes.status} ${patientRes.statusText}`);
    
    if (patientRes.ok) {
      const data = await patientRes.json();
      console.log(`✅ Auth successful! Found ${data.total ?? data.entry?.length ?? 0} patients`);
    } else {
      const errorText = await patientRes.text();
      console.log(`❌ Auth failed:`);
      console.log(errorText.substring(0, 500));
    }
  } catch (err) {
    console.log(`❌ Request failed: ${err}`);
  }

  // Test 3: Try without /fhir prefix (Aidbox native API)
  console.log('\nTest 3: Fetching Patients via Aidbox native API...');
  try {
    const nativeRes = await fetch(`${AIDBOX_BASE_URL}/Patient?_count=1`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`  Status: ${nativeRes.status} ${nativeRes.statusText}`);
    
    if (nativeRes.ok) {
      const data = await nativeRes.json();
      console.log(`✅ Native API works! Found ${data.total ?? data.entry?.length ?? 0} patients`);
    } else {
      const errorText = await nativeRes.text();
      console.log(`❌ Native API failed:`);
      console.log(errorText.substring(0, 500));
    }
  } catch (err) {
    console.log(`❌ Request failed: ${err}`);
  }
}

testConnection();
