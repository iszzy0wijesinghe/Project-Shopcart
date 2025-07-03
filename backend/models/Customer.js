import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
    customerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phoneNo: { type: String, required: true },
});

export default mongoose.model("Customer", CustomerSchema);