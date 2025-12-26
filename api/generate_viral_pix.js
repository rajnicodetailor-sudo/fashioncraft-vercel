import * as admin from 'firebase-admin';
import Cors from 'cors';

const cors = Cors({ methods: ['POST', 'GET'] });

function initFirebase() {
  if (admin.apps.length) return;

  const envKeys = Object.keys(process.env);
  const serviceAccount = "{
  "type": "service_account",
  "project_id": "viral-pix",
  "private_key_id": "0ea19168a0f1f5e45deb96becb9619b815a5e338",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDCiIoMRbOYb2RQ\nOXXpAPsNtHPQk08CnRF0ER/nkygP13eMyCmZHX7ouUZRzF2v4nK18zyrLG2XyJjB\n+Xd1yvg4T9w+GLv4i00KyjiIgDsSO+CooSnn/s0e3JD8zkeoGdxdab0E5Y9DZjox\nMxm7Tqunl8CoFMwr1ja3V3BRR7AXPDMNfiQYokMf5rRpE3j6Vr4Hqh+Mt98M1kKI\nFsTwey++RsJWZ5grqKQgH1Q2XjeGQXVQWEtf51zQbYZq17mNbVRGjeP8AWnqVodj\ntnRZuHnBkMocJqdWz8FLdeTYbsj5JM1tgtyoE5chn8xntIiyWLlTxnsN1Tn0u1i5\nl7iL3BCrAgMBAAECggEAF1i+WKK03y00jibsmROJDdKuY5s09vdVdOc+kP2pkofQ\nIpE94iZsE2TI+mAwjj9Qd7hte42ldCXwT2IFOESCbcpdKwavkzCvWlrSq28tp7k6\nnoJZE9gR/guH9bnmrQINicMlmu+CC3C6uH+Ngwakte8R1sTy4VVK084mqK/rLkkm\n8wmN55Qx/nUHl9mqlZLwJU+PChWe81SvYg3nw95ulyDVvjLLWgC7pjDXtnSzkwEL\n3SnHX5ibjut5hcRmNv9d6wkYD/NIMGQGLiNkW+ZOIKP8fDvvFwD7XF7t8J3TzGSc\njvjrDBfzH6m22JN8qwn0BK0T9lBOcZqccDByhZEQgQKBgQDtCJDcOa5m/AwSjSDy\nAaMpRSJ3I540tiMSn22WzMl9vVjHS9C6GeKV/xkNtSQ8DeanGCmg9aHYSy+OnaoB\nZo7d28A2BENFw+RaONaW76LJnelkHstoJZS6kOalEzc1mOtuyv3jC7dWmTclS3S3\nt5LLqeh4y8bwDnAx8o7dh9ctuwKBgQDSGWTaTK3aOyWOTUKEC5K3g09RIPPgSzYo\nh2jDUxlgwbf3VzYVrb2J+ehbL0d0xlzWsmDyEAGKssD4PQmR8ERqiPQHVPsyTu27\nOQ69R7bXtVszHvnBYAKpxXbqNLZILt4/fTyQ8n420xFt9+/LeQRdPSo8paTD9QOn\nOpKNqOYB0QKBgQDPfOgRXwyjaY7HznJAZd6FidcZozwhuC4LZzNvBeR7BPxpuJwF\nzBLkamFr9ly5lRGKw0PtehcqVuZSWQEwKK521p3yqtiYgVmrAIYXqb0979UVpz82\n8261wZGkfqWdbTbpzRdhYCgkzgnPw7Vv/GmrjhfJZdfG21yq3EDi+r4JcQKBgE/r\nvQOVm6SiTzz8gsr8JAmO98Mix+KQeb+dEusKV2MJDdQW5soEV09/MzZMm9/9/R7m\nqB4snImISgOkJFnRjhUAl+OaHhwbDi/kGolCGHmh0Vl29QbsYNb3+K5K8vQub/iy\nyTFSLVTpoX21jRBXrqNROxnq4Oxx7bvVeh5NG4GhAoGAYjBGq2gqALmIQcGZAtjh\nC9wJe0KN2SuldVeMud2676Cm8pUhxCpi4Oxz3nxedjHgnFOIUfr8ohfOEs67taAU\nDl/Qd2YIKFHzhcZmuJdTaVLYi86B0jE8LCxRdsbRNuGDPanVyS8WydOMjesRCYcm\nSJIO4GMe8fyR9XadEiq0yPw=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@viral-pix.iam.gserviceaccount.com",
  "client_id": "113684380264999146707",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40viral-pix.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
";

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
