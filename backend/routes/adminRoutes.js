const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const auth = require("../middleware/auth");
const ExcelJS = require("exceljs");

// 🔒 PROTECTED: FETCH CONTACTS
router.get("/contacts", auth, async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });
  res.json(contacts);
});

// 🔒 PROTECTED: EXPORT EXCEL
router.get("/export", auth, async (req, res) => {
  const contacts = await Contact.find();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Contacts");

  sheet.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Email", key: "email", width: 30 },
    { header: "Message", key: "message", width: 40 },
    { header: "Date", key: "createdAt", width: 25 }
  ];

  contacts.forEach(c => sheet.addRow({
    ...c.toObject(),
    createdAt: new Date(c.createdAt).toLocaleString()
  }));

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=contacts.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;


const { Parser } = require("json2csv");

router.get("/export/csv", auth, async (req, res) => {
  try {
    const contacts = await Contact.find().lean();

    const fields = ["name", "phone", "email", "message", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(contacts);

    res.header("Content-Type", "text/csv");
    res.attachment("contacts.csv");
    res.send(csv);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "CSV export failed" });
  }
});

const PDFDocument = require("pdfkit");

router.get("/export/pdf", auth, async (req, res) => {
  try {
    const contacts = await Contact.find();

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=contacts.pdf");

    doc.pipe(res);

    doc.fontSize(18).text("SAIUX – Contact Leads", { align: "center" });
    doc.moveDown();

    contacts.forEach((c, index) => {
      doc
        .fontSize(12)
        .text(`Lead ${index + 1}`, { underline: true })
        .text(`Name: ${c.name}`)
        .text(`Phone: ${c.phone}`)
        .text(`Email: ${c.email}`)
        .text(`Message: ${c.message}`)
        .text(`Date: ${new Date(c.createdAt).toLocaleString()}`)
        .moveDown();
    });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "PDF export failed" });
  }
});

