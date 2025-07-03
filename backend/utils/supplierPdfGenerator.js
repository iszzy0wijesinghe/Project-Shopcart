import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 🛠 Emulate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateSupplierPDF = (suppliers, res) => {
  try {
    const doc = new PDFDocument({ margin: 50 });
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    res.setHeader('Content-Disposition', 'attachment; filename="Suppliers_Report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // 🟧 Border
    const drawBorder = () => {
      doc
        .rect(20, 20, pageWidth - 40, pageHeight - 40)
        .strokeColor('#bbb')
        .lineWidth(1)
        .stroke();
    };
    drawBorder();
    doc.on('pageAdded', drawBorder);

    // 🖼 Logo
    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth / 2 - 60, 40, { width: 120 });
    }

    // 📨 Contact Info + Generated Date
    const contactY = 100;
    const email = 'GoCart@gmail.com';
    const phone = '+94-716348026';
    const address = '740 Sudarshana Road, Kelaniya';

    const emailX = 50;
    const phoneWidth = doc.widthOfString(phone);
    const phoneX = pageWidth / 2 - phoneWidth / 2;
    const addressWidth = doc.widthOfString(address);
    const addressX = pageWidth - 50 - addressWidth;

    doc
      .fontSize(11)
      .fillColor('#555')
      .text(email, emailX, contactY);

    doc
      .fontSize(11)
      .fillColor('#555')
      .text(phone, phoneX, contactY);

    doc
      .fontSize(11)
      .fillColor('#555')
      .text(address, addressX, contactY);

    // 📋 Title
    const title = 'Supplier Report';
    const titleWidth = doc.widthOfString(title, { fontSize: 18 });
    doc
      .fontSize(18)
      .fillColor('#333')
      .text(title, (pageWidth - titleWidth) / 2.2, 130);

    // 🔻 Underline
    doc
      .strokeColor('#ccc')
      .lineWidth(1)
      .moveTo(50, 155)
      .lineTo(pageWidth - 50, 155)
      .stroke();

    doc.y = 175;

    // 📦 Table Settings
    const colWidths = {
      name: 140,
      email: 170,
      phone: 120,
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

      doc.text('Company Name', 55, currentY + 9, { width: colWidths.name });
      doc.text('Email', 55 + colWidths.name, currentY + 9, { width: colWidths.email });
      doc.text('Phone', 55 + colWidths.name + colWidths.email, currentY + 9, { width: colWidths.phone });
      doc.text('Category', 55 + colWidths.name + colWidths.email + colWidths.phone, currentY + 9, { width: colWidths.category });

      currentY += rowHeight;

      doc
        .strokeColor('#ccc')
        .moveTo(50, currentY)
        .lineTo(pageWidth - 50, currentY)
        .stroke();
    };

    drawTableHeader();

    // 📄 Table Rows
    suppliers.forEach((s, index) => {
      if (currentY + rowHeight > pageHeight - 80) {
        doc.addPage();
        currentY = 50;
        drawBorder();
        drawTableHeader();
      }

      const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
      doc
        .fillColor('black')
        .rect(50, currentY, pageWidth - 100, rowHeight)
        .fill(bgColor)
        .fontSize(10)
        .fillColor('#333');

      doc.text(s.companyName || '-', 55, currentY + 9, { width: colWidths.name });
      doc.text(s.companyEmail || '-', 55 + colWidths.name, currentY + 9, { width: colWidths.email });
      doc.text(s.phoneNumber || '-', 55 + colWidths.name + colWidths.email, currentY + 9, { width: colWidths.phone });
      doc.text(s.itemCategory || '-', 55 + colWidths.name + colWidths.email + colWidths.phone, currentY + 9, { width: colWidths.category });

      currentY += rowHeight;

      doc
        .strokeColor('#eee')
        .moveTo(50, currentY)
        .lineTo(pageWidth - 50, currentY)
        .stroke();
    });

    // 📊 Total Suppliers
    if (currentY + 70 > pageHeight - 50) {
      doc.addPage();
      currentY = 50;
      drawBorder();
    }

    doc.moveDown(3);
    doc
      .strokeColor('#ccc')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(pageWidth - 50, doc.y)
      .stroke()
      .moveDown(1);

    doc
      .fontSize(12)
      .fillColor('#000')
      .font('Helvetica-Bold')
      .text(`Total Suppliers: ${suppliers.length}`, {
        align: 'left',
        lineBreak: false
      });

    doc.end();
  } catch (err) {
    console.error('🔥 PDF Generation Error:', err.message);
    res.status(500).json({ message: 'PDF generation failed', error: err.message });
  }
};

export default generateSupplierPDF;
