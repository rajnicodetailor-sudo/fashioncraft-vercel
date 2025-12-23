import * as admin from 'firebase-admin';
import Cors from 'cors';

const cors = Cors({ methods: ['POST', 'GET'] });

function initFirebase() {
  if (admin.apps.length) return;

  const envKeys = Object.keys(process.env);
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    throw new Error('Firebase env missing');
  }

  const parsed=JSON.parse(serviceAccount);

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
        //return res.status(405).json({ error: 'Method not allowed' });
      }

      Console.log('Firebase init satrted');
      initFirebase();

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];
       Console.log('Firebase init completed');
      const decoded = await admin.auth().verifyIdToken(token);

      if (!decoded.email_verified) {
        return res.status(403).json({ error: 'User not verified' });
      }

      return res.status(200).json({
          ok: true,
          message: 'user verified',
        });
      
      const { modelImage, productImage } = req.body || {};
      if (!modelImage || !productImage) {
        return res.status(400).json({ error: 'Images required' });
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
                  text:
`You are creating a UGC-style marketing image.

Image 1 is the reference model.
Do NOT change the model’s face, facial structure, skin tone, age, gender, or identity.

Image 2 is the product/item to be featured.
Place it naturally like real user-generated content.

Rules:
- Preserve exact facial identity
- No text, logos, watermarks
- Natural lighting
- Real smartphone UGC look`
                },
                { inline_data: { mime_type: 'image/jpeg', data: modelImage } },
                { inline_data: { mime_type: 'image/jpeg', data: productImage } },
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

      const image =
        json?.candidates?.[0]?.content?.parts
          ?.find(p => p.inline_data)?.inline_data?.data;

      if (!image) {
        return res.status(500).json({
          error: 'Image generation failed',
          geminiResponse: json,
        });
      }

      return res.status(200).json({ image });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message,
      });
    }
  });
}
