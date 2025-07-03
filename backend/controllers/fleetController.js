import VehicleType from "../models/VehicleType.js";
import Driver from "../models/Driver.js";
import Trip from "../models/Trip.js";
import ShopOwner from "../models/ShopOwner.js";

import moment from "moment-timezone";
import logger from '../utils/logger.js';

/* ---------- Vehicle Types ---------- */

// Create a VehicleType (Admin only)
export const createVehicleType = async (req, res) => {
  try {
    const { typeName, picture, totalWeightCapacity, boxCapacity, ratePerKM } = req.body;
    const { storeId } = req.user;
    
    // Check if the storeId has the required authority
    if (storeId !== 'STORE1234') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Store does not have the required authority to update a Category',
      });
    }

    //  Check if the vehicle type already exists
    const existingVehicleType = await VehicleType.findOne({ typeName });
    if (existingVehicleType) {
      return res.status(400).json({ error: "Vehicle type already exists" });
    }

    //  Create new vehicle type
    const newVehicleType = new VehicleType({
      typeName,
      picture,
      totalWeightCapacity,
      boxCapacity,
      ratePerKM,
    });

    await newVehicleType.save();

    const loggerMsg = `Vehicle Type ${typeNmae} is Created by ${storeId}`;
    logger.info(loggerMsg);

    res.status(201).json({
      success: true,
      message: "Vehicle type created successfully",
      vehicleType: newVehicleType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch the vehicle Types
export const listVehicleTypes = async (req, res) => {
  try {
    const types = await VehicleType.find({});

    // const loggerMsg = `Listing Vehicle Types to ${req}`;
    // logger.info(loggerMsg);

    return res.status(200).json({ success: true, data: types });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update a VehicleType (Admin only)
export const updateVehicleType = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalWeightCapacity, boxCapacity, ratePerKM } = req.body;
    const { storeId } = req.user;

    // Check if the storeId has the required authority
    if (storeId !== 'STORE1234') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Store does not have the required authority to update vehicleTypes.',
      });
    }

    const updatedVehicle = await VehicleType.findByIdAndUpdate(
      id,
      { totalWeightCapacity, boxCapacity, ratePerKM },
      { new: true }
    );

    const loggerMsg = `Vehicle Type ${updatedVehicle.typeName} is Updated by ${storeId}`;
    logger.info(loggerMsg);

    res.status(200).json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ---------- Drivers ---------- */

// Create a Driver (Admin only)
// export const createDriver = async (req, res) => {
//   try {
//     const {
//       driverId, // Custom Identifier (e.g., driver001)
//       fullName,
//       profilePhoto,
//       dateOfBirth,
//       gender,
//       phoneNumber,
//       emailAddress,
//       homeAddress,
//       emergencyContact,
//       licenseNumber,
//       expirationDate,
//       vehicleRegNo,
//       vehicleType,
//       vehicleDetails,
//       vehicleColor,
//       hireDate,
//       assignedShops, // Array of storeIds (e.g., ["store001", "store002"])
//     } = req.body;

//     // Check if driverId or vehicleRegNo already exists
//     const existingDriver = await Driver.findOne({ driverId });
//     const existingVehicle = await Driver.findOne({ vehicleRegNo });

//     if (existingDriver) {
//       return res.status(400).json({ error: "Driver with this ID already exists" });
//     }
//     if (existingVehicle) {
//       return res.status(400).json({ error: "Vehicle with this registration number is already assigned" });
//     }

//     // Create new driver
//     const newDriver = new Driver({
//       driverId,
//       fullName,
//       profilePhoto,
//       dateOfBirth,
//       gender,
//       phoneNumber,
//       emailAddress,
//       homeAddress,
//       emergencyContact,
//       licenseNumber,
//       expirationDate,
//       vehicleRegNo,
//       vehicleType,
//       vehicleDetails,
//       vehicleColor,
//       hireDate,
//       assignedShops, // Stores store IDs directly
//       employmentStatus: "active",
//     });

//     await newDriver.save();

//     const loggerMsg = `Driver ${newDriver.fullName} is Created by ${storeId}`;
//     logger.info(loggerMsg);

//     const populatedDriver = await Driver.findById(newDriver._id)
//       .populate("vehicleType") // Populate vehicle type details

//     // Manually fetch assigned shops (since storeId is a string, not ObjectId)
//     const assShops = await ShopOwner.find({ storeId: { $in: populatedDriver.assignedShops } })
//       .select("fname email password phone_no store_name store_address");

//     // // Replace assignedShops with full shop details
//     populatedDriver.assignedShops = assShops;

//     res.status(201).json({ success: true, message: "Driver created successfully", driver: populatedDriver });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

export const createDriver = async (req, res) => {
  try {
    // ─── 1) pull only the fields your form provides ────────────────────────────────
    const {
      fullName,
      dateOfBirth,
      gender,
      phoneNumber,
      emailAddress,
      drivingLicenseNo,   // your “licenseNumber”
      licenseExpiry,      // your “expirationDate”
      vehicleRegNo,
      vehicleType,
      vehicleDetails,           // new form field
      homeAddress,          // new form field
    } = req.body;

    // ─── 2) generate sequential DRVxxx driverId ────────────────────────────────────
    const count = await Driver.countDocuments();
    const next = (count + 1).toString().padStart(3, "0");
    const driverId = `DRV${next}`;

    logger.info(`Driver is creating for ${JSON.stringify(req.body)} |`);

    // ─── 4) now assemble your newDriver, filling in all the defaults ──────────────
    const newDriver = new Driver({
      driverId,                      // auto-generated
      fullName,
      dateOfBirth,
      gender,
      phoneNumber,
      emailAddress,
      homeAddress,
      emergencyContact: phoneNumber, // same as phone
      licenseNumber: drivingLicenseNo,
      expirationDate: licenseExpiry,
      vehicleRegNo,
      vehicleType,
      vehicleDetails,
      vehicleColor: "black",         // default
      hireDate: new Date(),          // created-at
      assignedShops: ["STORE1234"],  // default
      employmentStatus: "active"     // default
    });

    await newDriver.save();

    // populate the vehicleType name and shopOwner info if you want
    const populated = await Driver.findById(newDriver._id)
      .populate("vehicleType")
      .lean();

    res.status(201).json({
      success: true,
      message: "Driver created",
      driver: populated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    // Attempt to find and delete
    const deleted = await Driver.findOneAndDelete({ _id: driverId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `No driver found with driverId '${driverId}'.`
      });
    }

    logger.info(`Driver ${deleted.fullName} (${driverId}) deleted by ${req.user.storeId}`);
    return res.status(200).json({
      success: true,
      message: `Driver '${deleted.fullName}' deleted successfully.`
    });
  } catch (err) {
    console.error("Error deleting driver:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting driver.",
      error: err.message
    });
  }
};

// Fetch drivers assigned to a shop, filtering by vehicle type & availability
export const getDriversByVehicle = async (req, res) => {
  try {
    const { vehicleTypeId } = req.params;
    const { storeId }      = req.user;
    const { filter, search } = req.query;

    // Base query: matching vehicleType + this shop’s assignment
    let filterQuery = {
      vehicleType:  vehicleTypeId,
      assignedShops: storeId,
    };

    // availability filters (unchanged)
    if (filter === "available") {
      filterQuery["availability.status"]  = "available";
      filterQuery["availability.storeId"] = null;
    } else if (filter === "assigned") {
      filterQuery["availability.status"]  = "notavailable";
      filterQuery["availability.storeId"] = storeId;
    } else if (filter === "unavailable") {
      filterQuery["availability.status"]  = "notavailable";
      filterQuery["availability.storeId"] = { $ne: storeId };
    }

    // NEW: name‐based search
    if (search) {
      filterQuery.fullName = { $regex: search, $options: "i" };
    }

    let drivers = await Driver.find(filterQuery);

    // add “assigned” flag
    drivers = drivers.map(d => ({
      ...d.toObject(),
      assigned:
        d.availability.status === "notavailable" &&
        d.availability.storeId === storeId,
    }));

    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignedDrivers = async (req, res) => {
  try {
    const { storeId } = req.user; // Shop ID from authenticated user
    const { filter } = req.query; // Query param for filtering

    let filterQuery = {
      assignedShops: storeId,
    };

    const loggerMsg = `Listing Assigned Drivers for the shop ${storeId}`;
    logger.info(loggerMsg);

    // Apply filters based on the request query
    if (filter === "available") {
      filterQuery["availability.status"] = "available";
      filterQuery["availability.storeId"] = null;
    } else if (filter === "assigned") {
      filterQuery["availability.status"] = "notavailable";
      filterQuery["availability.storeId"] = storeId;
    } else if (filter === "unavailable") {
      filterQuery["availability.status"] = "notavailable";
      filterQuery["availability.storeId"] = { $ne: storeId }; // Drivers busy with another shop
    }

    // Fetch drivers based on filter conditions
    let drivers = await Driver.find(filterQuery);

    // Add an 'assigned' field to indicate if the driver is assigned to the requesting shop
    drivers = drivers.map(driver => ({
      ...driver.toObject(),
      assigned: driver.availability.status === "notavailable" && driver.availability.storeId === storeId,
    }));

    const loggerMsg2 = `Drivers are shown to ${storeId}`;
    logger.info(loggerMsg2);

    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get driver performance metrics for a driver
export const getDriverPerformance = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { storeId } = req.user;

    const driver = await Driver.findOne({ driverId });

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    // Fetch performance metrics for this shop
    const shopMetrics = driver.performanceMetricsPerShop.find(m => m.storeId === storeId) || {};

    // Fetch last 5 trip ratings for visualization
    const trips = await Trip.find({ driverId, storeId, tripStatus: "Completed" })
      .sort({ deliveryDate: -1 })
      .limit(5)
      .select("customer_ratings.average_rating deliveryDate");

    // Prepare ratings data for frontend chart
    const ratingsData = trips.map(trip => ({
      date: trip.deliveryDate,
      rating: trip.customer_ratings.average_rating,
    }));

    const performanceData = {
      driverName: driver.fullName,
      driverId: driver.driverId,
      totalDistanceTraveled: shopMetrics.totalDistanceTraveled || 0,
      totalTimeSpent: shopMetrics.totalTimeSpent || 0,
      totalCustomerComplaints: shopMetrics.totalCustomerComplaints || 0,
      totalOrdersDelivered: shopMetrics.totalOrdersDelivered || 0,
      totalRefundedOrders: shopMetrics.totalRefundedOrders || 0,
      customerAvgRating: driver.averageRatings.customer.average_rating || 0,
      shopOwnerAvgRating: driver.averageRatings.shopOwner.average_rating || 0,
      averageEarning: driver.averageEarningsPerShop.find(m => m.storeId === storeId)?.averageEarning || 0,
      recommend_status: driver.recommend_status,
      ratingsChartData: ratingsData,
    };

    const loggerMsg = `Driver [${driver.fullName}]'s Performances are shown to ${storeId}`;
    logger.info(loggerMsg);

    res.status(200).json(performanceData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ---------- Trips ---------- */

// create a scheduled trip
export const createTrip = async (req, res) => {
  try {
    const {
      driverId,
      storeId,
      orders,
      tripDuration, // { startTime, endTime, durationInMinutes } (PRE-CALCULATED)
      distanceTraveled, // PRE-CALCULATED
      earning, // PRE-CALCULATED
      deliveryDate,
    } = req.body;

    // Validate Driver Existence
    const existingDriver = await Driver.findOne({ driverId: driverId });
    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Check for Existing Trips in the Given Date & Time Range
    const conflictingTrip = await Trip.findOne({
      driverId,
      deliveryDate,
      tripStatus: { $in: ["Scheduled", "In Progress"] }, // Only consider active trips
      $or: [
        { 
          "tripDuration.startTime": { $lt: tripDuration.endTime },
          "tripDuration.endTime": { $gt: tripDuration.startTime }
        },
      ],
    });

    if (conflictingTrip) {
      return res.status(400).json({
        error: "A trip for this driver already exists within the given time range.",
      });
    }

    // Create Scheduled Trip (using pre-calculated predictions)
    const newTrip = new Trip({
      driverId,
      storeId,
      orders,
      tripDuration, // Directly storing pre-calculated duration values
      distanceTraveled,
      earning,
      deliveryDate,
      tripStatus: "Scheduled",
    });

    const loggerMsg = `Scheduled Trip for driver ${existingDriver.fullName} is Created by ${storeId}`;
    logger.info(loggerMsg);

    await newTrip.save();
    res.status(201).json({ success: true, message: "Trip scheduled successfully", trip: newTrip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update the scheduled trip to completed
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      actualDistance, // If different from predicted
      actualEarning, // If different from predicted
      noOfOrdersDelivered,
      noOfRefundedOrders,
      shopOwner_rating,
      customer_ratings,
      customer_complaints,
    } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (trip.tripStatus === "Completed") {
      return res.status(400).json({ error: "Trip has already been completed." });
    }

    // Mark trip as completed
    trip.tripStatus = "Completed";
    trip.tripDuration.endTime = moment().tz("Asia/Kolkata").toDate(); // Set end time
    trip.tripDuration.durationInMinutes = Math.round(
      (trip.tripDuration.endTime - trip.tripDuration.startTime) / 60000
    ); // Calculate actual duration

    // Update values only if provided
    trip.distanceTraveled = actualDistance || trip.distanceTraveled;
    trip.earning = actualEarning || trip.earning;
    trip.noOfOrdersDelivered = noOfOrdersDelivered || trip.noOfOrdersDelivered;
    trip.noOfRefundedOrders = noOfRefundedOrders || trip.noOfRefundedOrders;
    trip.shopOwner_rating = shopOwner_rating || trip.shopOwner_rating;

    // Update customer ratings (if provided)
    if (customer_ratings) {
      trip.customer_ratings.total_ratings += customer_ratings.total_ratings;
      trip.customer_ratings.rating_sum += customer_ratings.rating_sum;
      trip.customer_ratings.average_rating =
        trip.customer_ratings.rating_sum / trip.customer_ratings.total_ratings;
    }

    // Add customer complaints (if any) and Prevent duplicate complaints
    if (customer_complaints && customer_complaints.length > 0) {
      customer_complaints.forEach((newComplaint) => {
        const duplicate = trip.customer_complaints.find(
          (existingComplaint) =>
            existingComplaint.customerId === newComplaint.customerId &&
            existingComplaint.complaint.toLowerCase().trim() === newComplaint.complaint.toLowerCase().trim()
        );
        if (!duplicate) {
          trip.customer_complaints.push(newComplaint);
        }
      });
    }

    await trip.save();

    const loggerMsg = `Trip ${trip._id} is Updated to Completed by ${storeId}`;
    logger.info(loggerMsg);

    // Update Driver Stats
    const driver = await Driver.findOne({ driverId: trip.driverId });
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    await driver.updateEarnings(trip.storeId, trip.earning);
    await driver.updatePerformance(trip.storeId, trip);
    await driver.updateAvailability(trip); // Mark driver as available again
    await driver.updateTotalEarnings(trip.earning);
    await driver.updateRatings(trip);

    // Update `lastDeliveryDate` and auto-check employment status
    driver.lastDeliveryDate = trip.tripDuration.endTime;
    await driver.save();

    res.status(200).json({ success: true, message: "Trip completed successfully", trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// create a completed trip ( for testing purposes )
export const createCompletedTrip = async (req, res) => {
  try {
    const {
      driverId,
      storeId,
      orders,
      tripDuration, // { startTime, endTime, durationInMinutes }
      distanceTraveled,
      earning,
      deliveryDate,
      noOfOrdersDelivered,
      noOfRefundedOrders,
      shopOwner_rating,
      customer_ratings,
      customer_complaints,
    } = req.body;

    // Validate Driver
    const existingDriver = await Driver.findOne({ driverId });
    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Create Completed Trip
    const newTrip = new Trip({
      driverId,
      storeId,
      orders,
      tripDuration,
      distanceTraveled,
      earning,
      deliveryDate,
      noOfOrdersDelivered,
      noOfRefundedOrders,
      shopOwner_rating,
      customer_ratings,
      customer_complaints,
      tripStatus: "Scheduled", // Directly set status to Completed
    });

    await newTrip.save();

    const loggerMsg = `Scheduled Trip for driver ${existingDriver.fullName} is Created by ${storeId}`;
    logger.info(loggerMsg);

    // Call `updateTrip` to update driver stats
    req.params.id = newTrip._id.toString();
    req.body = {
      actualDistance: distanceTraveled,
      actualEarning: earning,
      noOfOrdersDelivered,
      noOfRefundedOrders,
      shopOwner_rating,
      customer_ratings,
      customer_complaints,
    };

    // Trigger the update function to sync driver stats
    await updateTrip(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get 5 most recent trip for the given storeId
export const getRecentTrips = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { storeId } = req.user;

    // Check if the driver Exists
    const driver = await Driver.findOne({ driverId }, "fullName profilePhoto");
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    // Fetch last 5 completed trips for the given driver & store
    const trips = await Trip.find({ driverId, storeId, tripStatus: "Completed" })
      .sort({ deliveryDate: -1 })
      .limit(5);

    const recentTrips = trips.map((trip) => ({
      ...trip.toObject(),
      driverName: driver.fullName,
      driverPhoto: driver.profilePhoto,
    }));

    const loggerMsg = `5 most Recent Trips done by ${driver.fullName} for ${storeId} is shown to the ${storeId}`;
    logger.info(loggerMsg);

    res.status(200).json(recentTrips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming trips schedule for a driver
export const getDriverAvailability = async (req, res) => {
  try {
    const { driverId } = req.params;

    // Fetch all scheduled trips
    const trips = await Trip.find({ driverId, tripStatus: "Scheduled" }).sort({ deliveryDate: 1 });

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
