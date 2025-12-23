import Cors from "cors";

// Initialize CORS
const cors = Cors({
  methods: ["GET", "POST", "OPTIONS"]
});

// Helper to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  // Default response if path is "/"
  if (req.url === "/") {
    return res.status(200).json({ message: "Welcome to Vercel Test API" });
  }

  // Handle /api/test specifically
  if (req.url.startsWith("/api/test")) {
    return res.status(200).json({
      status: "success",
      data: "This is the test response from /api/test"
    });
  }

  // Fallback for unknown paths
  return res.status(404).json({ error: "Route not found" });
}