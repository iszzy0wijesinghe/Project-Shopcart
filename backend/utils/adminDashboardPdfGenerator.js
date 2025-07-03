import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 🛠 Simulate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateAdminDashboardPDF = (suppliers, chartData, _requestData, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Disposition', 'attachment; filename="Admin_Dashboard_Report.pdf"');
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // 🔶 Page Border
  const drawBorder = () => {
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
      .strokeColor('#bbb')
      .lineWidth(1)
      .stroke();
  };
  drawBorder();
  doc.on('pageAdded', drawBorder);

  // 🔶 Logo
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

  // 📋 Admin Dashboard Title
  const title = 'Admin Dashboard Summary';
  const titleWidth = doc.widthOfString(title, { fontSize: 18 });
  doc
    .fontSize(18)
    .fillColor('#333')
    .text(title, (pageWidth - titleWidth) / 2.4, 130);

  // 🔻 Underline
  doc
    .strokeColor('#ccc')
    .lineWidth(1)
    .moveTo(50, 155)
    .lineTo(pageWidth - 50, 155)
    .stroke();

  doc.y = 175; // Set position for bar chart

  // 🔷 Bar Chart Title
  const chartTitle = 'Suppliers by Food Type';
  const chartTitleWidth = doc.widthOfString(chartTitle, { fontSize: 14 });
  doc
    .fontSize(14)
    .fillColor('#222')
    .text(chartTitle, (pageWidth - chartTitleWidth) / 2, doc.y);

  doc.moveDown(1); // Small spacing

  // 🔷 Bar Chart
  const canvasWidth = 600;
  const canvasHeight = 300;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  const padding = { top: 30, left: 40, right: 30, bottom: 70 };
  const chartWidth = canvasWidth - padding.left - padding.right;
  const chartHeight = canvasHeight - padding.top - padding.bottom;

  const labels = chartData.map(d => d.foodType);
  const values = chartData.map(d => d.count);
  const maxValue = Math.max(...values, 1);

  const barWidth = 30;
  const spacing = (chartWidth - (barWidth * values.length)) / (values.length - 1);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Grid lines & y-axis
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#000';

  const step = Math.ceil(maxValue / 5);
  for (let i = 0; i <= 5; i++) {
    const yVal = i * step;
    const y = padding.top + chartHeight - (yVal / maxValue) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvasWidth - padding.right, y);
    ctx.stroke();
    ctx.fillText(yVal.toString(), 5, y + 4);
  }

  // Draw bars
  values.forEach((val, i) => {
    const x = padding.left + i * (barWidth + spacing);
    const height = (val / maxValue) * chartHeight;
    const y = padding.top + chartHeight - height;

    ctx.fillStyle = '#ff6a00';
    ctx.fillRect(x, y, barWidth, height);

    // Label
    const label = labels[i];
    ctx.fillStyle = '#000';
    const words = label.split(' ');
    words.forEach((word, j) => {
      ctx.fillText(word, x, padding.top + chartHeight + 15 + j * 12);
    });
  });

  const barChartImg = canvas.toBuffer('image/png');
  doc.image(barChartImg, (pageWidth - 450) / 2, doc.y, { width: 450 });
  doc.moveDown(2);

  // 🔄 New page for Table
  doc.addPage();

  // 🔶 Supplier Table
  const colWidths = {
    name: 140,
    email: 170,
    phone: 120,
    category: 100,
  };
  const rowHeight = 30;
  let currentY = doc.y;

  const drawTableHeader = () => {
    doc.fillColor('white')
      .rect(50, currentY, pageWidth - 100, rowHeight)
      .fill('#ff6a00')
      .fontSize(11)
      .fillColor('white');

    doc.text('Company Name', 55, currentY + 8, { width: colWidths.name });
    doc.text('Email', 55 + colWidths.name, currentY + 8, { width: colWidths.email });
    doc.text('Phone', 55 + colWidths.name + colWidths.email, currentY + 8, { width: colWidths.phone });
    doc.text('Category', 55 + colWidths.name + colWidths.email + colWidths.phone, currentY + 8, { width: colWidths.category });

    currentY += rowHeight;
  };

  drawTableHeader();

  suppliers.forEach((s, index) => {
    if (currentY + rowHeight > pageHeight - 100) {
      doc.addPage();
      currentY = 50;
      drawTableHeader();
    }

    const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';

    doc.fillColor('black')
      .rect(50, currentY, pageWidth - 100, rowHeight)
      .fill(bgColor)
      .fontSize(10)
      .fillColor('#333');

    doc.text(s.companyName || '-', 55, currentY + 8, { width: colWidths.name });
    doc.text(s.companyEmail || '-', 55 + colWidths.name, currentY + 8, { width: colWidths.email });
    doc.text(s.phoneNumber || '-', 55 + colWidths.name + colWidths.email, currentY + 8, { width: colWidths.phone });
    doc.text(s.itemCategory || '-', 55 + colWidths.name + colWidths.email + colWidths.phone, currentY + 8, { width: colWidths.category });

    currentY += rowHeight;
  });

  // ➡️ Total Suppliers Count
  if (currentY + 70 > pageHeight - 50) {
    doc.addPage();
    currentY = 50;
  }

  doc.moveDown(2);

  // Draw separator
  doc
    .strokeColor('#ccc')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(pageWidth - 50, doc.y)
    .stroke()
    .moveDown(1);

  // Write Total Suppliers
  const totalText = `Total Suppliers: ${suppliers.length}`;
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

export default generateAdminDashboardPDF;
