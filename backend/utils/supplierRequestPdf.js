import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ⏩ Emulate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateSupplierRequestsPDF = (requests, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=supplier-requests.pdf');

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // 🟧 Draw Border
  doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
    .lineWidth(1)
    .strokeColor('#ccc')
    .stroke();

  // 🖼 Logo (centered)
  const logoPath = path.join(__dirname, '../assets/logo.png');
  let logoAdded = false;
  if (fs.existsSync(logoPath)) {
    const imageX = (pageWidth - 100) / 2;
    doc.image(logoPath, imageX, 30, { width: 100 });
    logoAdded = true;
  }

  // 📨 Contact Info
  if (logoAdded) {
    const contactY = 100;
    const email = 'GoCart@gmail.com';
    const phone = '+94-716348026';
    const address = '740 Sudarshana Road, Kelaniya';

    const phoneWidth = doc.widthOfString(phone);
    const addressWidth = doc.widthOfString(address);

    doc
      .fontSize(11)
      .fillColor('#555')
      .text(email, 50, contactY);

    doc
      .fontSize(11)
      .fillColor('#555')
      .text(phone, pageWidth / 2 - phoneWidth / 2, contactY);

    doc
      .fontSize(11)
      .fillColor('#555')
      .text(address, pageWidth - 50 - addressWidth, contactY);
  }

  // 📋 Title ("Supplier Requests Report" centered)
  const title = 'Supplier Requests Report';
  const titleWidth = doc.widthOfString(title, { fontSize: 20 });
  doc
    .fontSize(20)
    .fillColor('#ff6a00')
    .text(title, (pageWidth - titleWidth) / 2.6, 130);

  // 🔻 Underline under title
  doc
    .strokeColor('#ccc')
    .lineWidth(1)
    .moveTo(50, 155)
    .lineTo(pageWidth - 50, 155)
    .stroke();

  doc.y = 175; // Move below header for table

  // 📏 Table Settings
  const x = {
    name: 55,
    email: 190,
    maxStock: 355,
    minStock: 420,
    category: 490
  };
  const colWidths = {
    name: 130,
    email: 160,
    maxStock: 60,
    minStock: 60,
    category: 100
  };
  const rowHeight = 30;
  let currentY = doc.y;

  // 🧾 Table Header
  const drawTableHeader = () => {
    doc
      .strokeColor('#ccc')
      .lineWidth(1)
      .moveTo(50, currentY)
      .lineTo(pageWidth - 50, currentY)
      .stroke();

    doc
      .fillColor('white')
      .rect(50, currentY, pageWidth - 100, rowHeight)
      .fill('#ff6a00')
      .fontSize(11)
      .fillColor('white');

    doc.text('Company Name', x.name, currentY + 9, { width: colWidths.name });
    doc.text('Email', x.email, currentY + 9, { width: colWidths.email });
    doc.text('Max Stock', x.maxStock, currentY + 9, { width: colWidths.maxStock });
    doc.text('Min Stock', x.minStock, currentY + 9, { width: colWidths.minStock });
    doc.text('Category', x.category, currentY + 9, { width: colWidths.category });

    currentY += rowHeight;

    doc
      .strokeColor('#ccc')
      .lineWidth(1)
      .moveTo(50, currentY)
      .lineTo(pageWidth - 50, currentY)
      .stroke();
  };

  drawTableHeader();

  // 📄 Data Rows
  requests.forEach((r, index) => {
    if (currentY + rowHeight > pageHeight - 70) {
      doc.addPage();
      currentY = 50;
      drawTableHeader();
    }

    const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
    doc
      .fillColor('black')
      .rect(50, currentY, pageWidth - 100, rowHeight)
      .fill(bgColor);

    doc
      .fontSize(10)
      .fillColor('#333')
      .text(r.companyName || '-', x.name, currentY + 9, { width: colWidths.name })
      .text(r.companyEmail || '-', x.email, currentY + 9, { width: colWidths.email })
      .text(r.maxStock?.toString() || '-', x.maxStock, currentY + 9, { width: colWidths.maxStock })
      .text(r.minStock?.toString() || '-', x.minStock, currentY + 9, { width: colWidths.minStock })
      .text(r.categoryType || '-', x.category, currentY + 9, { width: colWidths.category });

    currentY += rowHeight;

    doc
      .strokeColor('#eee')
      .moveTo(50, currentY)
      .lineTo(pageWidth - 50, currentY)
      .stroke();
  });

  // ➡️ Total Requests Section
  doc.moveDown(3);

  doc
    .strokeColor('#ccc')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(pageWidth - 50, doc.y)
    .stroke()
    .moveDown(1);

  const totalText = `Total Requests: ${requests.length}`;
  doc
    .fontSize(11)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text(totalText, {
      align: 'left',
      lineBreak: false
    });

  doc.end();
};

export default generateSupplierRequestsPDF;
