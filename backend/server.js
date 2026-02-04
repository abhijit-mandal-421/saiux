require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Middleware - CORS configured for production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    process.env.FRONTEND_URL  // Add your Render frontend URL here
  ].filter(Boolean),
  credentials: true
}));
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
