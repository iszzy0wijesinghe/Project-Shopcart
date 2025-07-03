import { Router } from 'express';
import {
    createVehicleType,
    listVehicleTypes,
    updateVehicleType,

    createDriver,
    deleteDriver,
    getDriversByVehicle,
    getDriverPerformance,

    createTrip,
    updateTrip,
    createCompletedTrip,
    getRecentTrips,
    getDriverAvailability
} from "../controllers/fleetController.js";

import { validateAccessToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Vehicle Type Management
router.post("/vehicles/create-vehicle", validateAccessToken, createVehicleType);
router.get("/vehicles", validateAccessToken, listVehicleTypes);
router.put("/vehicles/:id", validateAccessToken, updateVehicleType);

// Driver Management
router.post("/drivers/create-driver", validateAccessToken, createDriver);
router.delete("/drivers/delete-driver/:driverId", validateAccessToken, deleteDriver);
router.get("/drivers/:vehicleTypeId", validateAccessToken, getDriversByVehicle);
router.get("/drivers/performance/:driverId", validateAccessToken, getDriverPerformance);

// Trip Management
router.post("/trips/create-trip", createTrip);
router.post("/trips/create-completed-trip", createCompletedTrip);
router.put("/trips/:id", updateTrip);
router.get("/trips/recent/:driverId", validateAccessToken, getRecentTrips);
router.get("/trips/availability/:driverId", validateAccessToken, getDriverAvailability);

export default router;