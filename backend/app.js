import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger.js';
import { connect } from "./utils/db_connection.js";

import authRoutes from "./routes/authRoutes.js";

import supplierRoutes from "./routes/supplierRoutes.js"
import requestRoutes from "./routes/requestRoutes.js"
import shopOwnerRequestRoutes from "./routes/shopOwnerRequestRoutes.js";

import productRoutes from './routes/productRoutes.js';
import fleetRoutes from './routes/fleetRoutes.js';
import custAuthRoutes from "./routes/custRoutes.js";

const app = express();
const PORT = process.env.PORT || 8090;


app.use(cors({
  origin: 'https://project-shopcart.vercel.app',
  credentials: true
}));
// app.use(httpLogger);
app.use(express.json( {limit: "100kb"} ));
app.use(cookieParser());

app.get("/", (req, res, next) => {
    res.send("<h2>Welcome to SHOPCART</h2>");
    next();
})

// Routes
app.use("/api/auth", authRoutes);

app.use("/api", custAuthRoutes)

app.use('/api', supplierRoutes)
app.use('/api', requestRoutes) 
app.use('/api', shopOwnerRequestRoutes)

app.use('/api/catalog', productRoutes);
app.use('/api/fleet', fleetRoutes);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    connect();
});