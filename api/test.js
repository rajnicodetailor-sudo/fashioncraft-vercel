import * as admin from 'firebase-admin';
import Cors from 'cors';

const cors = Cors({ methods: ['POST'] });

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
console.log('ENV keys:', Object.keys(process.env));

if (!serviceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT env missing');
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccount)),
});

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
