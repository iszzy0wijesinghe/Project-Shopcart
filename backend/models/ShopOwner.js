import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const shopOwnerSchema = new mongoose.Schema(
  {
    storeId: {
      type: String,
      required: true,
      unique: true,
    },
    fname: {
      type: String,
      required: [true, "First name is required"],
    },
    lname: {
      type: String,
      required: [true, "Last name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    phone_no: {
      type: String,
      required: [true, "Phone number is required"],
      match: [
        /^[0-9]{10,15}$/,
        "Please provide a valid phone number (10-15 digits)",
      ],
    },
    store_name: {
      type: String,
      required: [true, "Store name is required"],
    },
    store_address: {
      type: String,
      required: [true, "Store address is required"],
    },
    location_coords: {
      type: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      required: [true, "Location coordinates are required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // For simplicity, we let Mongoose handle createdAt and updatedAt via timestamps
    refreshTokens: [
      {
        token: {
          type: String, // This will store the *hashed* token
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 30 * 24 * 60 * 60, // 30 days in seconds
        },
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving if it's new or modified
shopOwnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Add a method to *hash* the refresh token and store it
shopOwnerSchema.methods.addRefreshToken = async function (plainRefreshToken) {
  const salt = await bcrypt.genSalt(10);
  const hashedToken = await bcrypt.hash(plainRefreshToken, salt);

  this.refreshTokens.push({ token: hashedToken });
  await this.save();
};

// Remove a refresh token by comparing the plain token to the hashed ones in DB
shopOwnerSchema.methods.removeRefreshToken = async function (plainRefreshToken) {
  // Filter out the matching token
  // We must compare each hashed token to find a match
  const remaining = [];
  for (const rt of this.refreshTokens) {
    const isMatch = await bcrypt.compare(plainRefreshToken, rt.token);
    if (!isMatch) {
      remaining.push(rt);
    }
  }
  this.refreshTokens = remaining;
  await this.save();
};

// Check if the given plain refresh token is in the user's refreshTokens array
shopOwnerSchema.methods.hasRefreshToken = async function (plainRefreshToken) {
  for (const rt of this.refreshTokens) {
    const isMatch = await bcrypt.compare(plainRefreshToken, rt.token);
    if (isMatch) {
      return true;
    }
  }
  return false;
};

export default mongoose.model("ShopOwner", shopOwnerSchema);
