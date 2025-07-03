import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerId: {
        type: String,
        ref: "Customer",
        required: true
    },
    storeId: {
        type: String,
        ref: "Customer",
        required: true
    },

    deliveryAddress: { type: String, required: true },
    orderAmount: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
});

export default mongoose.model("Order", OrderSchema);
