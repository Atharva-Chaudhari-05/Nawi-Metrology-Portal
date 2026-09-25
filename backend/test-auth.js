async function test() {
  console.log('--- Testing Auth Routes ---');

  // 1. Signup
  const signupRes = await fetch('http://localhost:3001/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Demo Manufacturer',
      email: 'demo@mfg.com',
      password: 'password123',
      role: 'MANUFACTURER',
      companyName: 'Demo Mfg',
      manufacturerLicenseNo: 'MFG-DEMO-123'
    })
  });
  console.log('Signup Status:', signupRes.status);
  console.log('Signup Body:', await signupRes.json());

  // 2. Login
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rajesh.officer@metrology.gov.in',
      password: 'password123'
    })
  });
  
  // Extract token from response body instead of dealing with cookies in fetch for this test
  const loginBody = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Login Body:', loginBody);

  const token = loginBody.token;

  // 3. Me (Using Auth header fallback)
  const meRes = await fetch('http://localhost:3001/api/auth/me', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Me Status:', meRes.status);
  console.log('Me Body:', await meRes.json());
}

test();
