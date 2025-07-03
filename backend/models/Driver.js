import mongoose from "mongoose";
import moment from "moment"; // For date calculations

const DriverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: { type: String, required: true },
    profilePhoto: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    phoneNumber: { type: String },
    emailAddress: { type: String },
    homeAddress: { type: String },
    emergencyContact: { type: String },

    // License Information
    licenseNumber: { type: String, required: true },
    expirationDate: { type: Date, required: true }, // Used for automatic suspension
    licenseStatus: {
      type: String,
      enum: ["approved", "suspended", "lost"],
      default: "approved",
    },

    // Vehicle Details
    vehicleRegNo: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleType",
      required: true,
    },
    vehicleDetails: { type: String, required: true }, // Specific details (e.g., "Yamaha Bike", "Honda Scooter")
    vehicleColor: { type: String },

    // Employment & Assignment Details
    hireDate: { type: Date },
    employmentStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastDeliveryDate: { type: Date, default: null }, // Used to determine inactivity
    role: { type: String, default: "Driver" },

    assignedShops: [
      { type: String, ref: "ShopOwner" } // Stores `storeId`
    ],

    // Driver Availability
    availability: {
      status: { type: String, enum: ["available", "notavailable"], default: "available" },
      storeId: { type: String, ref: "ShopOwner", default: null }, // Null when available, Shop ID when delivering
      tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null }, // Tracks active trip
    },

    // Ratings & Recommendations
    averageRatings: {
      customer: {
        total_ratings: { type: Number, default: 0 },
        rating_sum: { type: Number, default: 0 },
        average_rating: { type: Number, default: 0 },
      },
      shopOwner: {
        total_ratings: { type: Number, default: 0 },
        rating_sum: { type: Number, default: 0 },
        average_rating: { type: Number, default: 0 },
      },
    },
    recommend_status: {
      type: String,
      enum: ["recommend", "not recommend"],
      default: "recommend",
    },

    // Earnings & Performance
    totalEarnings: { type: Number, default: 0 },
    averageEarningsPerShop: [
      {
        storeId: { type: String, ref: "ShopOwner" },
        totalTrips: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 },
        averageEarning: { type: Number, default: 0 }, // Calculated automatically
      },
    ],

    // Performance Tracking Per Store
    performanceMetricsPerShop: [
      {
        storeId: { type: String, ref: "ShopOwner" },
        totalDistanceTraveled: { type: Number, default: 0 }, // Updated per trip
        totalTimeSpent: { type: Number, default: 0 }, // Updated per trip (in minutes)
        totalCustomerComplaints: { type: Number, default: 0 }, // Updated per trip
        totalOrdersDelivered: { type: Number, default: 0 }, // Updated per trip
        totalRefundedOrders: { type: Number, default: 0 }, // Updated per trip
      },
    ],
  },
  { timestamps: true }
);

// Indexing for optimized searches
DriverSchema.index({
  vehicleType: 1,
  assignedShops: 1,
  "availability.status": 1,
  "availability.storeId": 1,
});

// Middleware for automatic updates on licenseStatus, employmentStatus and recommend_status
DriverSchema.pre("save", function (next) {
  const today = moment();

  // 1 **Automatically Suspend License if Expired**
  if (this.expirationDate && moment(this.expirationDate).isBefore(today)) {
    this.licenseStatus = "suspended";
  }

  // 2️ **Automatically Set Employment Status to Inactive**
  if (this.lastDeliveryDate && moment(this.lastDeliveryDate).isBefore(today.subtract(3, "months"))) {
    this.employmentStatus = "inactive";
  }

  // 3️ **Automatically Set Recommendation Status**
  if (this.averageRatings.customer.average_rating < 2.0) {
    this.recommend_status = "not recommend";
  } else {
    this.recommend_status = "recommend";
  }

  next();
});

// Automatically update availability based on trip status
DriverSchema.methods.updateAvailability = async function (trip) {
  if (trip.tripStatus === "In Progress") {
    this.availability = { status: "notavailable", storeId: trip.storeId, tripId: trip._id };
  } else {
    this.availability = { status: "available", storeId: null, tripId: null };
  }
  await this.save();
};

// Method to update earnings per shop
DriverSchema.methods.updateEarnings = function (storeId, tripEarning) {
  let shopRecord = this.averageEarningsPerShop.find((s) => s.storeId === storeId);

  if (shopRecord) {
    shopRecord.totalTrips += 1;
    shopRecord.totalEarnings += tripEarning;
    shopRecord.averageEarning = shopRecord.totalEarnings / shopRecord.totalTrips;
  } else {
    this.averageEarningsPerShop.push({
      storeId, // storing storeId (e.g., "store001")
      totalTrips: 1,
      totalEarnings: tripEarning,
      averageEarning: tripEarning,
    });
  }

  return this.save();
};

// Method to Update Total Earnings
DriverSchema.methods.updateTotalEarnings = async function (tripEarning) {
  this.totalEarnings += tripEarning;
  await this.save();
};

// Method to update performance per shop
DriverSchema.methods.updatePerformance = function (storeId, tripDetails) {
  let shopRecord = this.performanceMetricsPerShop.find((s) => s.storeId === storeId);

  if (shopRecord) {
    shopRecord.totalDistanceTraveled += tripDetails.distanceTraveled;
    shopRecord.totalTimeSpent += tripDetails.tripDuration.durationInMinutes;
    shopRecord.totalCustomerComplaints += tripDetails.customer_complaints ? tripDetails.customer_complaints.length : 0;
    shopRecord.totalOrdersDelivered += tripDetails.noOfOrdersDelivered;
    shopRecord.totalRefundedOrders += tripDetails.noOfRefundedOrders;
  } else {
    this.performanceMetricsPerShop.push({
      storeId,
      totalDistanceTraveled: tripDetails.distanceTraveled,
      totalTimeSpent: tripDetails.tripDuration.durationInMinutes,
      totalCustomerComplaints: tripDetails.customer_complaints ? tripDetails.customer_complaints.length : 0,
      totalOrdersDelivered: tripDetails.noOfOrdersDelivered,
      totalRefundedOrders: tripDetails.noOfRefundedOrders,
    });
  }

  return this.save();
};

// Method to update average Ratings per shop
DriverSchema.methods.updateRatings = async function (trip) {
  // Update Customer Ratings
  this.averageRatings.customer.total_ratings += trip.customer_ratings.total_ratings;
  this.averageRatings.customer.rating_sum += trip.customer_ratings.rating_sum;
  this.averageRatings.customer.average_rating =
    this.averageRatings.customer.rating_sum / this.averageRatings.customer.total_ratings;

  // Update Shop Owner Ratings
  this.averageRatings.shopOwner.total_ratings += 1;
  this.averageRatings.shopOwner.rating_sum += trip.shopOwner_rating;
  this.averageRatings.shopOwner.average_rating =
    this.averageRatings.shopOwner.rating_sum / this.averageRatings.shopOwner.total_ratings;

  await this.save();
};

export default mongoose.model("Driver", DriverSchema);