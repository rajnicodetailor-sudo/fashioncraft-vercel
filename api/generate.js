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
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      initFirebase();

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split(' ')[1];      
      const decoded = await admin.auth().verifyIdToken(token);

      if (decoded.firebase?.sign_in_provider !== 'phone') {
        return res.status(403).json({ error: 'User not verified via phone' });
      }
      
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
`You are creating a UGC-style marketing image.\n\nImage 1 is the reference model.\nDo NOT change the model’s face, facial structure, skin tone, age, gender, or identity in any way.\nThe face must remain exactly the same as Image 1.\n\nImage 2 is the product/item to be featured.\nPlace this item naturally in the scene so it looks like real user-generated content.\n\nYou MAY change:\n- Pose and body posture\n- Outfit and accessories\n- Background and environment\n- Lighting, colors, and camera angle\n- Hand position and how the item is held\n\nYou MUST:\n- Preserve the exact facial identity from Image 1\n- Ensure the face looks realistic and unaltered\n- Make the final image look like a genuine smartphone UGC photo\n- Avoid over-editing, filters, or artificial effects\n- DO NOT add any text, captions, logos, brand names, watermarks, stickers, or symbols on the image\n\nStyle:\n- Natural lighting\n- Casual, real-life setting\n- Authentic social media UGC aesthetic\n- Not studio-like or stock-photo style\n\nOutput requirements:\n- Generate a single high-quality image\n- The image must contain NO visible text of any kind`
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
