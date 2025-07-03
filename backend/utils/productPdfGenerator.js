import PDFDocument from 'pdfkit';
import axios from 'axios';
import moment from 'moment';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

export const generateProductsPdf = async (res) => {
  const now = moment();
  const invoiceNo = 'INV' + now.format('YYMMDDHHmmss');
  const dateStr = now.format('DD / MM / YYYY');
  const timeStr = now.format('HH : mm');

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  async function drawHeader() {
    const logoUrl = 'https://res.cloudinary.com/dfejydorr/image/upload/v1751562829/Asset_4_shbgzu.png';
    try {
      const { data: imageData } = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const logoBuffer = Buffer.from(imageData, 'binary');
      doc.image(logoBuffer, 40, 20, { width: 110 });
    } catch (e) {
      console.warn('Could not fetch logo:', e.message);
    }

    doc.font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#393E46')//#000 //FFA500
      .text('Product - Catalog | ShopCart', { align: 'center' });

    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000');
    doc.text(`Address : 740 Sudarshana Road,`, 40, 80);
    doc.text(`Kelaniya`, 40, 95);
    doc.text(`Email : ShopCart@gmail.com`, 40, 110);

    doc.text(`Invoice No : ${invoiceNo}`, 380, 80);
    doc.text(`Time : ${timeStr}`, 380, 95);
    doc.text(`Date : ${dateStr}`, 380, 110);
  }

  await drawHeader();

  let firstCategory = true;
  const categories = await Category.find().sort({ name: 1 }).lean();

  for (const category of categories) {
    const products = await Product.find({ category: category._id, isDeleted: false }).sort({ name: 1 }).lean();
    if (!products.length) continue;

    if (!firstCategory) {
      doc.addPage();
      await drawHeader();
    }
    firstCategory = false;

    doc.moveDown(2);

    const tableTopY = doc.y;
    const startX = 30;
    const colWidths = [30, 160, 50, 70, 70, 80, 70];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    doc.roundedRect(startX, tableTopY, tableWidth, (products.length + 1) * 28 + 80, 10).fill('#F5F5F5');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(16).text(category.name, 50, tableTopY + 20);

    const headers = ['No', 'Product Name', 'Unit', 'Before Disc.', 'After Disc.', 'Last Edited', 'Available'];

    let cursorY = tableTopY + 60;
    let colX = startX;

    doc.font('Helvetica-Bold').fontSize(12);
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], colX + 5, cursorY, { width: colWidths[i] - 10, align: 'center' });
      colX += colWidths[i];
    }

    cursorY += 28;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const badgeText = p.availability ? 'Available' : 'Not Available';
      const badgeColor = p.availability ? '#28a745' : '#dc3545';

      colX = startX;
      const rowData = [
        String(i + 1).padStart(2, '0'),
        p.name,
        p.unit || '500 g',
        `Rs ${p.priceBeforeDiscount.toFixed(2)}`,
        `Rs ${p.priceAfterDiscount.toFixed(2)}`,
        moment(p.updatedAt).fromNow(),
        ''
      ];

      doc.font('Helvetica').fontSize(11).fillColor('#000');
      for (let j = 0; j < rowData.length - 1; j++) {
        let alignOption = 'center';
        if (j === 1) alignOption = 'left';
        if (j === 3 || j === 4) alignOption = 'right';
        doc.text(rowData[j], colX + 5, cursorY + 6, { width: colWidths[j] - 10, align: alignOption });
        colX += colWidths[j];
      }

      doc.roundedRect(colX + 10, cursorY + 6, 60, 18, 5).fill(badgeColor);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9)
        .text(badgeText, colX + 10, cursorY + 10, { width: 60, align: 'center' });

      cursorY += 28;
    }
  }

  doc.end();
};
