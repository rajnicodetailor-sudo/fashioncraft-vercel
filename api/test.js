import * as admin from 'firebase-admin';
import Cors from 'cors';

const cors = Cors({ methods: ['POST'] });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  await new Promise((r) => cors(req, res, r));

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 🔐 Auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    if (!decoded.email_verified) {
      return res.status(403).json({ error: 'User not verified' });
    }

    return res.status(200).json({ error: 'User verified' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
