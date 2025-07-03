export default function (req, res, next) {
  const {
    storeId,
    password,
    encryptedCode,
    gps_latitude,
    gps_longitude,
    deviceId,
    browserToken,
    ipAddress,
  } = req.body;

  // storeId and encryptedCode are mandatory for matching in LoginAttempt
  if (!storeId || !encryptedCode) {
    return res.status(400).json({
      success: false,
      message: 'storeId and encryptedCode are required.',
    });
  }

  // Must have location so we can do location+code check
  if (gps_latitude == null || gps_longitude == null) {
    return res.status(400).json({
      success: false,
      message: 'gps_latitude and gps_longitude must be provided.',
    });
  }

  // We track lock/block by deviceId or browserToken; at least one should exist
  if (!deviceId && !browserToken) {
    return res.status(400).json({
      success: false,
      message: 'Either deviceId or browserToken is required to identify the device.',
    });
  }

  // ipAddress is optional, but if provided, we’ll check it with a 3rd‐party
  next();
}
