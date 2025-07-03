import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 🛠 Emulate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateOrderPDF = (suppliers, res) => {
  try {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Disposition', 'attachment; filename="Suppliers_Report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // 🟧 Border
    const drawBorder = () => {
      doc
        .rect(20, 20, pageWidth - 40, pageHeight - 40)
        .strokeColor('#ccc')
        .lineWidth(0.8)
        .stroke();
    };
    drawBorder();
    doc.on('pageAdded', drawBorder);

    // 🖼 Logo
    const logoPath = path.join(__dirname, '../assets/logo.png');
    let logoAdded = false;
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth / 2 - 60, 30, { width: 120 });
      logoAdded = true;
    }

    // 📨 Contact Info under logo
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

    // 📋 Subtitle
    const title = 'My Requested Orders';
    const titleWidth = doc.widthOfString(title, { fontSize: 15 });
    doc
      .fontSize(15)
      .fillColor('#444')
      .text(title, (pageWidth - titleWidth) / 2.2, 130);

    // 🔻 Underline
    doc
      .strokeColor('#ccc')
      .lineWidth(1)
      .moveTo(50, 155)
      .lineTo(pageWidth - 50, 155)
      .stroke();

    doc.y = 175;

    // 📏 Column widths
    const colWidths = {
      name: 160,
      qty: 170,
      phone: 110,
      category: 110,
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
        .fontSize(10)
        .fillColor('white');

      doc.text('Company Name', 55, currentY + 9, { width: colWidths.name });
      doc.text('Ordered Qty', 55 + colWidths.name, currentY + 9, { width: colWidths.qty });
      doc.text('Phone', 55 + colWidths.name + colWidths.qty, currentY + 9, { width: colWidths.phone });
      doc.text('Category', 55 + colWidths.name + colWidths.qty + colWidths.phone, currentY + 9, { width: colWidths.category });

      currentY += rowHeight;

      doc
        .strokeColor('#ccc')
        .moveTo(50, currentY)
        .lineTo(pageWidth - 50, currentY)
        .stroke();
    };

    drawTableHeader();

    // 📄 Table Rows OR No Orders
    if (suppliers.length === 0) {
      doc
        .moveDown(3)
        .fontSize(14)
        .fillColor('#ff6a00')
        .font('Helvetica-Bold')
        .text('No Orders Found.', {
          align: 'center'
        });
    } else {
      suppliers.forEach((s, index) => {
        if (currentY + rowHeight > pageHeight - 70) {
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
          .fontSize(9.5)
          .fillColor('#333');

        doc.text(s.companyName || '-', 55, currentY + 9, { width: colWidths.name });
        doc.text(s.orderQuantity?.toString() || '-', 55 + colWidths.name, currentY + 9, { width: colWidths.qty });
        doc.text(s.phoneNumber || '-', 55 + colWidths.name + colWidths.qty, currentY + 9, { width: colWidths.phone });
        doc.text(s.itemCategory || '-', 55 + colWidths.name + colWidths.qty + colWidths.phone, currentY + 9, { width: colWidths.category });

        currentY += rowHeight;

        doc
          .strokeColor('#eee')
          .moveTo(50, currentY)
          .lineTo(pageWidth - 50, currentY)
          .stroke();
      });
    }

    // 🧮 Total Products Section
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

    const totalText = `Total Products: ${suppliers.length}`;
    doc
      .fontSize(11)
      .fillColor('#000')
      .font('Helvetica-Bold')
      .text(totalText, {
        align: 'left',
        lineBreak: false
      });

    doc.end();
  } catch (err) {
    console.error('🔥 PDF Generation Error:', err.message);
    res.status(500).json({ message: 'PDF generation failed', error: err.message });
  }
};

export default generateOrderPDF;
