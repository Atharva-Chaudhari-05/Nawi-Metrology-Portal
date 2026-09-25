async function test() {
  console.log('--- Testing Instrument Routes ---');

  // Login as Officer to get token
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rajesh.officer@metrology.gov.in',
      password: 'password123'
    })
  });
  const { token } = await loginRes.json();

  // Create Instrument
  const createRes = await fetch('http://localhost:3001/api/instruments', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      modelName: 'API Test Scale',
      instrumentType: 'ELECTRONIC_SCALE',
      serialNumber: `SN-API-${Date.now()}`,
      maxCapacity: 10,
      minCapacity: 0.1,
      eValue: 0.01,
      accuracyClass: 'II'
    })
  });
  console.log('Create Instrument Status:', createRes.status);
  const createdBody = await createRes.json();
  console.log('Create Body:', createdBody);

  // List Instruments
  const listRes = await fetch('http://localhost:3001/api/instruments', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('List Instruments Status:', listRes.status);
  const listBody = await listRes.json();
  console.log('List Body Count:', listBody.length);
}

test();
