require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Middleware - CORS configured for production and local development
const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const localOrigins = [
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const envOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || "").split(","),
]
  .map((origin) => normalizeOrigin(origin && origin.trim()))
  .filter(Boolean);

const allowedOrigins = new Set([
  ...localOrigins.map(normalizeOrigin).filter(Boolean),
  ...envOrigins,
]);

const isAllowedHost = (origin) => {
  try {
    const hostname = new URL(origin).hostname;
    return (
      hostname === "saiux.com" ||
      hostname.endsWith(".saiux.com") ||
      hostname.endsWith(".onrender.com") ||
      hostname.endsWith(".vercel.app") ||
      hostname.endsWith(".netlify.app")
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    if (
      normalizedOrigin &&
      (allowedOrigins.has(normalizedOrigin) || isAllowedHost(normalizedOrigin))
    ) {
      return callback(null, true);
    }

    console.log("CORS blocked origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());

// Database
connectDB();

// Routes
app.use("/api/admin", require("./routes/adminAuth"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
// Health check (VERY IMPORTANT)
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Port (dynamic – works everywhere)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
