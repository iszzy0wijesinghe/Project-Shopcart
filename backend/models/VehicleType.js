import mongoose from "mongoose";

const VehicleTypeSchema = new mongoose.Schema({
  typeName: {
    type: String,
    required: true,
    enum: ["Bicycle", "Bike", "TukTuk", "MiniVan", "Van", "Lorry 4ft", "Lorry 7ft"]
  },
  picture: {
    type: String // or store a URL to an image
  },
  totalWeightCapacity: {
    type: Number,
    required: true
  },
  boxCapacity: {
    type: Number,
    default: 0
  },
  ratePerKM: {
    type: Number,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('VehicleType', VehicleTypeSchema);