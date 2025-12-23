import * as admin from 'firebase-admin';
import Cors from 'cors';

export default function handler(req, res) {
  cors(req, res, async () => {
    try {      
      if (req.method == 'GET') {
        return res.status(200).json({ error: 'Method GET allowed' });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message,
      });
    }
  });
}
