import admin from 'firebase-admin';
import fetch from 'node-fetch';
import Cors from 'cors';

admin.initializeApp({
  credential: admin.credential.cert(require('../serviceAccount.json'))
});

const GEMINI_KEY = process.env.GEMINI_KEY;
const DAILY_LIMIT = 2;

const cors = Cors();

export default async function handler(req, res) {
  await new Promise((resolve) => cors(req, res, resolve));

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const today = new Date().toISOString().slice(0,10);

    // Firestore reference
    const userRef = admin.firestore().collection('user_usage').doc(uid);
    const doc = await userRef.get();

    let count = 0;
    if (doc.exists) {
      const data = doc.data();
      if (data.lastDate === today) {
        count = data.count || 0;
      } else {
        // New day → reset count
        count = 0;
      }
    }

    if (count >= DAILY_LIMIT) return res.status(429).json({ error: 'Daily limit reached' });

    const { modelImage, productImage } = req.body;
    if (!modelImage || !productImage) return res.status(400).json({ error: 'Images required' });

    // Call Gemini API
    const body = {
      contents: [
        {
          parts: [
            { text: 'You are creating a UGC-style marketing image.\n\nImage 1 is the reference model.\nDo NOT change the model’s face, facial structure, skin tone, age, gender, or identity in any way.\nThe face must remain exactly the same as Image 1.\n\nImage 2 is the product/item to be featured.\nPlace this item naturally in the scene so it looks like real user-generated content.\n\nYou MAY change:\n- Pose and body posture\n- Outfit and accessories\n- Background and environment\n- Lighting, colors, and camera angle\n- Hand position and how the item is held\n\nYou MUST:\n- Preserve the exact facial identity from Image 1\n- Ensure the face looks realistic and unaltered\n- Make the final image look like a genuine smartphone UGC photo\n- Avoid over-editing, filters, or artificial effects\n- DO NOT add any text, captions, logos, brand names, watermarks, stickers, or symbols on the image\n\nStyle:\n- Natural lighting\n- Casual, real-life setting\n- Authentic social media UGC aesthetic\n- Not studio-like or stock-photo style\n\nOutput requirements:\n- Generate a single high-quality image\n- The image must contain NO visible text of any kind' },
            { inline_data: { mime_type: 'image/*', data: modelImage } },
            { inline_data: { mime_type: 'image/*', data: productImage } },
          ],
        },
      ],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16' } },
    };

    const geminiResp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
        body: JSON.stringify(body),
      }
    );

    const geminiJson = await geminiResp.json();
    const image = geminiJson.candidates?.[0]?.content?.parts?.find(p => p.inline_data)?.inline_data?.data;

    if (!image) throw new Error('Image generation failed');

    // Update Firestore
    await userRef.set({
      lastDate: today,
      count: count + 1,
      history: admin.firestore.FieldValue.arrayUnion({
        date: new Date().toISOString(),
        imageId: `fashion_${Date.now()}.png`
      })
    }, { merge: true });

    res.status(200).json({ image });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
