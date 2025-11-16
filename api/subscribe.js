import { google } from 'googleapis';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, recaptchaToken } = req.body;

  // Validate input
  if (!email || !recaptchaToken) {
    return res.status(400).json({ error: 'Email and reCAPTCHA token are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // 1. Verify reCAPTCHA token
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    
    // Skip reCAPTCHA in development if secret is not set or if SKIP_RECAPTCHA is true
    const skipRecaptcha = process.env.SKIP_RECAPTCHA === 'true' || !recaptchaSecret;
    
    if (!skipRecaptcha) {
      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`,
        { method: 'POST' }
      );

      const recaptchaData = await recaptchaResponse.json();

      console.log('reCAPTCHA verification response:', {
        success: recaptchaData.success,
        score: recaptchaData.score,
        action: recaptchaData.action,
        challenge_ts: recaptchaData.challenge_ts,
        hostname: recaptchaData.hostname,
        'error-codes': recaptchaData['error-codes']
      });

      if (!recaptchaData.success) {
        return res.status(400).json({ 
          error: 'reCAPTCHA verification failed',
          details: recaptchaData['error-codes'] || 'Unknown error',
          message: recaptchaData['error-codes']?.join(', ') || 'reCAPTCHA verification failed'
        });
      }

      // Lower threshold for local testing (or adjust as needed)
      const scoreThreshold = 0.3;
      if (recaptchaData.score < scoreThreshold) {
        console.warn(`reCAPTCHA score too low: ${recaptchaData.score} (threshold: ${scoreThreshold})`);
        return res.status(400).json({ 
          error: 'reCAPTCHA verification failed',
          details: `Score ${recaptchaData.score} is below threshold ${scoreThreshold}`
        });
      }
    } else {
      console.warn('⚠️ reCAPTCHA verification skipped (development mode)');
    }

    // 2. Set up Google Sheets API
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.error('Google Sheets credentials not found in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // 3. Read existing emails to check for duplicates
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:A', // Assuming emails are in column A
    });

    const existingEmails = readResponse.data.values || [];
    const emailList = existingEmails.flat().map(e => e.toLowerCase().trim());

    // Check for duplicate (case-insensitive)
    if (emailList.includes(email.toLowerCase().trim())) {
      return res.status(400).json({ error: 'duplicate', message: 'This email is already registered' });
    }

    // 4. Append new email with timestamp
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:B', // Column A: email, Column B: timestamp
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[email, timestamp]],
      },
    });

    // 5. Return success
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error in subscribe API:', error);
    // Return more detailed error for debugging
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

