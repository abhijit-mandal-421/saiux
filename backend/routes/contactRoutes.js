const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

// Email regex (simple & safe)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    // 1. Empty check
    if (!name || !phone || !email || !message) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // 2. Name length
    if (name.length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters"
      });
    }

    // 3. Phone validation (10 digits)
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        message: "Phone number must be 10 digits"
      });
    }

    // 4. Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    // 5. Message length
    if (message.length < 5 || message.length > 500) {
      return res.status(400).json({
        message: "Message must be between 5 and 500 characters"
      });
    }

    // 6. Save to DB
    await Contact.create({ name, phone, email, message });

    res.status(201).json({
      message: "Form submitted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
