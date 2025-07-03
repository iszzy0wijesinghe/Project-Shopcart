import mongoose from "mongoose";
import fs from "fs";
import PDFDocument from "pdfkit";
import cloudinary from "../configs/cloudinaryConfig.js"; 

import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Driver from "../models/Driver.js";
import ShopOwner from "../models/ShopOwner.js";

const TripSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      ref: "Driver",
      required: true,
    },
    storeId: {
      type: String,
      ref: "ShopOwner",
      required: true,
    },
    orders: [
      {
        orderId: {
          type: String,
          ref: "Order",
          required: true },
      },
    ],

    // Trip Status
    tripStatus: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Cancelled"],
      default: "Scheduled",
    },

    // Trip Duration
    tripDuration: {
      startTime: { type: Date, required: true }, // Given at scheduling
      endTime: { type: Date, default: null }, // Predicted at scheduling, updated on completion
      durationInMinutes: { type: Number, default: 0 }, // Predicted at scheduling, updated if changed
    },

    // Trip Performance
    distanceTraveled: { type: Number, default: 0 }, // Total KM driven in this trip (Predicted at scheduling, updated if changed)
    earning: { type: Number, default: 0 }, // Earnings for the trip (Given at scheduling, updated if changed)
    
    // Given at the Scheduling
    deliveryDate: { type: Date, required: true }, // Date of delivery
    // invoice: { // if the image is still wanted
    //   pdfUrl: {type: String, default: null },
    //   imgUrl: {type: String, default: null },
    // },
    invoice: { type: String, default: null }, // Stores PDF file path (URL or cloud storage)

    // Order Tracking
    noOfOrdersDelivered: { type: Number, default: 0 }, // Total delivered orders
    noOfRefundedOrders: { type: Number, default: 0 }, // Total refunded orders

    // Ratings
    shopOwner_rating: { type: Number, default: 0 }, // Single rating from shop owner
    customer_ratings: {
      total_ratings: { type: Number, default: 0 },
      rating_sum: { type: Number, default: 0 },
      average_rating: { type: Number, default: 0 },
    },

    // Customer Complaints
    customer_complaints: [
      {
        customerId: { type: String, ref: "Customer" },
        customer_phone_no: { type: String, default: "Can't Find" },
        complaintStatus: { type: String, enum: ["Pending", "Resolved"], default: "Pending" },
        complaint: { type: String, required: true },
        complaintDate: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Middleware to Calculate Trip Duration Automatically
TripSchema.pre("save", function (next) {
  if (this.tripDuration.startTime && this.tripDuration.endTime) {
    const durationMs = this.tripDuration.endTime - this.tripDuration.startTime;
    this.tripDuration.durationInMinutes = Math.round(durationMs / 60000); // Convert ms to minutes
  }
  next();
});

// Middleware to Populate Customer Phone Numbers with Error Handling
TripSchema.pre("save", async function (next) {
  try {
    if (this.customer_complaints && this.customer_complaints.length > 0) {
      for (let complaint of this.customer_complaints) {
        if (complaint.customerId) {
          const customer = await Customer.findOne({ customerId: complaint.customerId });
          if (customer && customer.phoneNo) {
            complaint.customer_phone_no = customer.phoneNo;
          } else {
            complaint.customer_phone_no = "Can't Find"; // If customer or phoneNo is missing
          }
        }
      }
    }
    next();
  } catch (error) {
    console.error("Error fetching customer phone number:", error);
    next(); // Proceed without blocking the save operation
  }
});

// Method to create an Invoice for the Trip
const generateInvoice = async (trip) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: [760, 960] });
    const filePath = `./invoices/trip_invoices/invoice_${trip._id}.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const pageWidth = doc.page.width;  // Get the total width of the page
    const imageWidth = 50;  // Set the desired image width
    const centerX = (pageWidth - imageWidth) / 2; // Calculate the X position to center the image

    doc.image("https://res.cloudinary.com/dfejydorr/image/upload/v1751562829/Asset_4_shbgzu.png", centerX, 30, { width: imageWidth }); // Ensure the logo file exists
    doc.moveDown(4);
    doc.fontSize(20).font("Helvetica-Bold").text(`Trip Invoice [${trip.tripStatus}]`, { align: "center" });
    doc.moveDown(2);

    // Invoice Header
    const invoiceNumberH = `INV-${trip._id}`;
    doc.fontSize(12).font("Helvetica-Bold").text(`Invoice No: ${invoiceNumberH}`);
    doc.fontSize(10).font("Helvetica").text(`Invoice Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Fetch Data
    const driver = await Driver.findOne({ driverId: trip.driverId }) || { fullName: "Unknown", phoneNumber: "N/A" };
    const store = await ShopOwner.findOne({ storeId: trip.storeId}) || { store_name: "Unknown", store_address: "N/A", phone_no: "N/A" };

    // Driver & Store Details
    doc.fontSize(12).font("Helvetica-Bold").text("Driver Details:");
    doc.fontSize(10).font("Helvetica").text(`Driver Name: ${driver.fullName}`);
    doc.text(`Driver Phone: ${driver.phoneNumber}`);
    doc.moveDown();
    
    doc.fontSize(12).font("Helvetica-Bold").text("Store Details:");
    doc.fontSize(10).font("Helvetica").text(`Store Name: ${store.store_name}`);
    doc.text(`Store Address: ${store.store_address}`);
    doc.text(`Store Phone: ${store.phone_no}`);
    doc.moveDown();

    // Trip Details
    doc.fontSize(12).font("Helvetica-Bold").text("Trip Details:");
    doc.fontSize(10).font("Helvetica").text(`Trip ID: ${trip._id}`);
    doc.text(`Delivery Date: ${new Date(trip.deliveryDate).toLocaleString()}`);
    doc.moveDown(2);

    // Order Summary Table
    doc.fontSize(12).font("Helvetica-Bold").text("Order Summary:");
    doc.moveDown();

    // Table Header
    const tableHeader = ["Order ID", "Customer Name", "Delivery Address", "Order Amount (LKR)", "                     Delivery Fee (LKR)"];
    const columnWidths = [100, 130, 180, 100, 150];
    const startX = 50;
    let currentY = doc.y;

    // Draw Table Headers
    doc.fontSize(10).font("Helvetica-Bold");
    tableHeader.forEach((text, index) => {
        doc.text(text, startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[index], align: "left" });
    });
    doc.moveTo(startX, currentY + 15).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY + 15).stroke();
    currentY += 25;

    doc.fontSize(10).font("Helvetica");
    let totalOrderValue = 0, totalDeliveryFee = 0;

    for (const orderItem of trip.orders) {
      const order = await Order.findOne({ orderId: orderItem.orderId });
      if (order) {
        const customer = await Customer.findOne({ customerId: order.customerId });
        const customerName = customer ? customer.name : "Unknown";
        const deliveryAddress = order.deliveryAddress || "No address provided";

        // Print each column's text
        doc.text(order.orderId, startX, currentY, { width: columnWidths[0], align: "left" });
        doc.text(customerName, startX + columnWidths[0], currentY, { width: columnWidths[1], align: "left" });
        doc.text(deliveryAddress, startX + columnWidths[0] + columnWidths[1], currentY, { width: columnWidths[2], align: "left" });
        doc.text(order.orderAmount.toFixed(2), startX + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY, { width: columnWidths[3], align: "right" });
        doc.text(order.deliveryFee.toFixed(2), startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], currentY, { width: columnWidths[4], align: "right" });

        // Draw horizontal line after each row
        doc.moveTo(startX, currentY + 15).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY + 15).stroke();
        currentY += 25;

        totalOrderValue += order.orderAmount;
        totalDeliveryFee += order.deliveryFee;
      }
    }

    doc.moveDown(2);
    doc.x = 50;

    // Summary Section
    doc.fontSize(10).text(`Total Orders: ${trip.orders.length}`);
    doc.text(`Total Order Value: LKR ${totalOrderValue.toFixed(2)}`);
    doc.text(`Total Delivery Fee: LKR ${totalDeliveryFee.toFixed(2)}`);
    doc.moveDown(2);

    if ( trip.tripStatus === "Completed") {
      doc.fontSize(11).font("Helvetica-Bold").text("Trip Completed", { underline: true });
      doc.moveDown();
      doc.fontSize(10).font("Helvetica").text(`Actual Distance: ${trip.distanceTraveled} KM`);
      doc.text(`Total Earning: ${trip.earning} LKR`);
      doc.moveDown();
      doc.text(`No. Of Successful Orders: ${trip.noOfOrdersDelivered}`);
      doc.text(`No. Of Refunded Orders: ${trip.noOfRefundedOrders}`);
      doc.moveDown();
      doc.text(`Shop Owner Rating: ${trip.shopOwner_rating}`);
      doc.text(`Customer Average Rating: ${trip.customer_ratings.average_rating}`);
      doc.text(`Complaints Received: ${trip.customer_complaints.length}`);
      doc.moveDown(2);
    }

    // Terms & Conditions Section
    doc.fontSize(11).font("Helvetica-Bold").text("Terms & Conditions:", { underline: true });
    doc.moveDown();
    doc.fontSize(10).font("Helvetica").text("1. This invoice is issued for the scheduled trip and is subject to completion of deliveries.");
    doc.text("2. The remaining balance will be settled upon trip completion.");
    doc.text("3. Any discrepancies must be reported within 24 hours.");
    doc.text("4. The driver is responsible for the timely and safe delivery of all assigned orders.");
    doc.moveDown(2);

    // Authorization Section
    doc.moveDown();
    doc.text("Authorized By:");
    doc.text(`${store.store_name}`);
    doc.moveDown();

    // Acknowledgment by Driver
    doc.text(`Acknowledgment by Driver:`);
    doc.text("I, ", { continued: true }).text(driver.fullName || "undefined", { underline: true, continued: true }).text(", acknowledge receipt of this advance invoice and agree to the terms mentioned above.");
    doc.moveDown();
    doc.text("Driver Signature: _______________");
    doc.moveDown();
    doc.text("Date: _______________");
    doc.moveDown();

    doc.end();

    writeStream.on("finish", () => resolve(filePath));

    // Convert the pdf to an img
    // writeStream.on("finish", async () => {
    //   // Convert PDF to Image
    //   const convert = fromPath(filePath, {
    //       density: 100,
    //       savePath: "./",
    //       format: "jpeg",
    //       width: 600,
    //       height: 800
    //   });
    //   await convert(1, { responseType: "image" });

    //   // Upload Image to Cloudinary
    //   const imageUpload = await cloudinary.uploader.upload(imagePath, {
    //       folder: "invoice_images"
    //   });
    //   fs.unlinkSync(imagePath); // Remove local image

    //   // Upload PDF to Cloudinary
    //   const pdfUpload = await cloudinary.uploader.upload(filePath, {
          // resource_type: "auto",
          // folder: "invoices",
          // public_id: `invoice_${trip._id}`,
    //   });
    //   fs.unlinkSync(filePath); // Remove local PDF

    //   resolve({ pdfUrl: pdfUpload.secure_url, imageUrl: imageUpload.secure_url });
    // });
    writeStream.on("error", reject);
  });
};

// Cloudinary Helper Functions
const getCloudinaryPublicId = (url) => url?.split("/").pop().split(".")[0];

const deleteOldInvoice = async (invoiceUrl) => {
  const publicId = getCloudinaryPublicId(invoiceUrl);
  if (publicId) await cloudinary.uploader.destroy(`invoices/${publicId}`);

  // const publicPdfId = getCloudinaryPublicId(invoiceUrl.pdfUrl);
  // if (publicPdfId) await cloudinary.uploader.destroy(`invoices/${publicPdfId}`);
  // const publicImgId = getCloudinaryPublicId(invoiceUrl.imgUrl);
  // if (publicImgId) await cloudinary.uploader.destroy(`invoices/${publicImgId}`);
};

const uploadToCloudinary = async (filePath, tripId) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      folder: "invoices",
      public_id: `invoice_${tripId}`,
    });
    fs.unlinkSync(filePath);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

// Middleware to Auto-Generate Invoice
TripSchema.pre("save", async function (next) {
  try {
    if (this.isNew || this.isModified("tripStatus")) {
      if (this.invoice) await deleteOldInvoice(this.invoice);

      const filePath = await generateInvoice(this);
      const cloudinaryUrl = await uploadToCloudinary(filePath, this._id);
      if (cloudinaryUrl) this.invoice = cloudinaryUrl;

      // const {pdfUrl, imageUrl } = await generateInvoice(this);
      // if(pdfUrl) this.invoice = pdfUrl;
      // if(imageUrl) this.invoice = imageUrl;
    }
    next();
  } catch (error) {
    console.error("Error generating invoice:", error);
    next();
  }
});

export default mongoose.model("Trip", TripSchema);
