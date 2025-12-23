import * as admin from 'firebase-admin';
import Cors from 'cors';

const cors = Cors({ methods: ['POST', 'GET'] });

export default function handler(req, res) {
  cors(req, res, async () => {
    try {
      // DEBUG: env keys
      const envKeys = Object.keys(process.env);

      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!serviceAccount) {
        return res.status(500).json({
          ok: false,
          error: 'FIREBASE_SERVICE_ACCOUNT env missing',
          envKeys,
        });
      }

      let parsed;
      try {
        parsed = JSON.parse(serviceAccount);
      } catch (e) {
        return res.status(500).json({
          ok: false,
          error: 'Invalid FIREBASE_SERVICE_ACCOUNT JSON',
          message: e.message,
        });
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
      }

      return res.status(200).json({
        ok: true,
        message: 'Firebase initialized successfully',
        projectId: parsed.project_id,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error.message,
        stack: error.stack,
      });
    }
  });
}
