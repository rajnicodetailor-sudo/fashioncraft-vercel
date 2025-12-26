import * as admin from 'firebase-admin';
import Cors from 'cors';

const cors = Cors({ methods: ['POST', 'GET'] });

function initFirebase() {
  if (admin.apps.length) return;

  const envKeys = Object.keys(process.env);
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_VIRAL_PIX;
  if (!serviceAccount) {
    throw new Error('Firebase env missing');
  }

  const parsed = JSON.parse(serviceAccount);

  if (!parsed) {
    throw new Error('Parsed Failed');
  }
  
  admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
}

export default function handler(req, res) {
  cors(req, res, async () => {
    try {      
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      initFirebase();

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];      
      const decoded = await admin.auth().verifyIdToken(token);

      if (!decoded.email_verified) {
        return res.status(403).json({ error: 'Email not verified' });
      }
      
      const { modelImage, promptText } = req.body || {};
      if (!modelImage || !promptText) {
        return res.status(400).json({ error: 'Image or Prompt required' });
      }

      const geminiResp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_KEY,
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text:promptText
                },
                { inline_data: { mime_type: 'image/jpeg', data: modelImage } },
              ],
            }],
            generationConfig: {
              responseModalities: ['IMAGE'],
              imageConfig: { aspectRatio: '9:16' },
            },
          }),
        }
      );

      const json = await geminiResp.json();

      console.log(`success------${json}`);
      return res.status(200).json({
          geminiResponse: json,
        });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message,
      });
    }
  });
}
