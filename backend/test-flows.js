async function test() {
  console.log('--- Testing Sessions, Review & Report Routes ---');

  // Login as Officer
  const offRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rajesh.officer@metrology.gov.in', password: 'password123' })
  });
  const { token: officerToken } = await offRes.json();

  // Login as Admin
  const adminRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@metrology.gov.in', password: 'password123' })
  });
  const { token: adminToken } = await adminRes.json();

  // Get instruments to pick one
  const instRes = await fetch('http://localhost:3001/api/instruments', {
    headers: { 'Authorization': `Bearer ${officerToken}` }
  });
  const instruments = await instRes.json();
  const instrumentId = instruments[0].id; // Just pick the first one

  // 1. Create Test Session (Officer)
  console.log('\n--- Create Test Session ---');
  const createSessRes = await fetch('http://localhost:3001/api/test-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officerToken}` },
    body: JSON.stringify({ instrumentId, labTemperature: 25, labHumidity: 50, labAtmosphericPressure: 1012 })
  });
  console.log('Create Session Status:', createSessRes.status);
  const sessionBody = await createSessRes.json();
  console.log(sessionBody);
  const sessionId = sessionBody.session.id;

  // 2. Add Test Result (Officer)
  console.log('\n--- Add Test Result ---');
  const addResRes = await fetch(`http://localhost:3001/api/test-sessions/${sessionId}/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officerToken}` },
    body: JSON.stringify({
      testType: 'WEIGHING_PERFORMANCE',
      rawReadings: [
        { loadPoint: 10, indicatedValue: 10, referenceValue: 10 },
        { loadPoint: 50, indicatedValue: 50.1, referenceValue: 50 } // Let's see if this passes/fails server-side
      ]
    })
  });
  console.log('Add Result Status:', addResRes.status);
  console.log(await addResRes.json());

  // 3. Submit Session (Officer)
  console.log('\n--- Submit Session ---');
  const subRes = await fetch(`http://localhost:3001/api/test-sessions/${sessionId}/submit`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${officerToken}` }
  });
  console.log('Submit Session Status:', subRes.status);
  console.log(await subRes.json());

  // 4. Officer tries to approve (Should fail 403)
  console.log('\n--- Officer Review (Should 403) ---');
  const badRevRes = await fetch(`http://localhost:3001/api/test-sessions/${sessionId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officerToken}` },
    body: JSON.stringify({ action: 'APPROVE' })
  });
  console.log('Officer Review Status:', badRevRes.status);

  // 5. Admin Review (Should pass 200)
  console.log('\n--- Admin Review (Should 200) ---');
  const goodRevRes = await fetch(`http://localhost:3001/api/test-sessions/${sessionId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ action: 'APPROVE', reviewNotes: 'Looks good' })
  });
  console.log('Admin Review Status:', goodRevRes.status);
  console.log(await goodRevRes.json());

  // 6. Report Generate Stub (Admin)
  console.log('\n--- Report Generate Stub ---');
  const repGenRes = await fetch(`http://localhost:3001/api/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ testSessionId: sessionId, signatureBase64: 'stub-base64' })
  });
  console.log('Report Generate Status:', repGenRes.status);
  console.log(await repGenRes.json());

  // 7. List Reports (Admin)
  console.log('\n--- List Reports ---');
  const repListRes = await fetch(`http://localhost:3001/api/reports`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('Report List Status:', repListRes.status);
  const reps = await repListRes.json();
  console.log('Report List Count:', reps.length);
}

test();
