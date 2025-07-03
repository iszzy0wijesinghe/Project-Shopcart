import mongoose from 'mongoose';
import logger from "../utils/logger.js"
import config from '../configs/config.js'

let database;

const connect = async () => {
    const MONGODB_URL = config.DB_CONNECTION_STRING;

    if (database) return;

    mongoose.connect(MONGODB_URL)
        .then((connection) => {
            database = connection;
            logger.info('Connected to MongoDB');
        })
        .catch((err) => {
            logger.error(`MongoDB Connection Error: ${err.message}`);
        })
};

export { connect };