const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport for a desktop resolution
  await page.setViewport({ width: 1280, height: 800 });
  
  // 1. Go to login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  
  // Login as admin
  await page.type('input[type="email"]', 'admin@metrology.gov.in');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load (checking for url or some element)
  await page.waitForSelector('a[href="/test-sessions"]');
  
  // 2. Go to Test Sessions
  await page.click('a[href="/test-sessions"]');
  await page.waitForSelector('text/SUBMITTED');
  
  // 3. Click Review on the first SUBMITTED session
  const reviewButtons = await page.$$('text/Review');
  if (reviewButtons.length > 0) {
    await reviewButtons[0].click();
  } else {
    console.log("No review button found");
    await browser.close();
    return;
  }
  
  await page.waitForSelector('text/Approve & Sign');
  
  // 4. Draw signature
  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 100, { steps: 10 });
  await page.mouse.move(box.x + 150, box.y + 80, { steps: 10 });
  await page.mouse.up();
  
  const currentUrl = page.url(); // e.g. /test-sessions/uuid/review
  const sessionId = currentUrl.split('/')[4]; // http://localhost:5173/test-sessions/uuid/review
  
  // 5. Approve Session
  const approveBtn = await page.$('text/Approve & Sign');
  await approveBtn.click();
  
  try {
    await page.waitForSelector('text/APPROVED', { timeout: 10000 });
  } catch (err) {
    console.error("Failed to find APPROVED text. Page content might show an error.");
    await page.screenshot({ path: 'C:/Users/Atharva/.gemini/antigravity-ide/brain/1a5189c4-b186-4476-8f0f-7e12d8ed77eb/error_screen.png' });
    await browser.close();
    return;
  }
  
  // Wait for backend to finish generating the PDF, just in case
  await new Promise(r => setTimeout(r, 2000));
  
  console.log(`Approving session ${sessionId} complete.`);
  
  // 8. Open the PDF URL directly in a new page to screenshot it
  const pdfUrl = `http://localhost:3001/api/test-sessions/${sessionId}/report`;
  console.log(`Navigating to PDF: ${pdfUrl}`);
  
  const pdfPage = await browser.newPage();
  await pdfPage.goto(pdfUrl, { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Take screenshot of the PDF view
  await pdfPage.screenshot({ path: 'C:/Users/Atharva/.gemini/antigravity-ide/brain/1a5189c4-b186-4476-8f0f-7e12d8ed77eb/real_ui_pdf_screenshot.png', fullPage: true });
  console.log('Saved screenshot of PDF from real UI flow.');
  
  await browser.close();
}

run().catch(console.error);
