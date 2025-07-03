import pkg from 'google-libphonenumber';
const { PhoneNumberUtil, PhoneNumberFormat } = pkg;

// validating the password for the customer auths
export const validatePassword = (password) => {
    const minLength = 8;

    if (password.length < minLength) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasUpper || !hasLower || !hasNumber) {
      return { 
        isValid: false, 
        message: 'Password must include uppercase, lowercase letters, and numbers' 
      };
    }
    
    return { isValid: true, message: 'Password is valid' };
};
  
const phoneUtil = PhoneNumberUtil.getInstance();

/**
 * Validates a phone number using google-libphonenumber.
 *
 * @param {string} phone - The phone number to validate.
 * @param {string} [region='LK'] - The region code to use for validation (default is 'LK' for Sri Lanka).
 * @returns {object} - An object containing:
 *   - isValid {boolean}: True if the phone number is valid.
 *   - message {string}: A descriptive message.
 *   - formatted {string} [optional]: The phone number formatted in E.164 if valid.
 */
export const validatePhone = (phone, region = 'LK') => {
  try {
    // Parse the phone number using the specified region
    const phoneNumber = phoneUtil.parse(phone, region);
    
    // Check if the parsed number is a valid number
    if (!phoneUtil.isValidNumber(phoneNumber)) {
      return { isValid: false, message: 'Invalid phone number format.' };
    }
    
    // Format the valid phone number into E.164 format (e.g., +94771234567)
    const formatted = phoneUtil.format(phoneNumber, PhoneNumberFormat.E164);
    
    return { isValid: true, message: 'Phone number is valid.', formatted };
  } catch (error) {
    // Catch parsing errors and return a friendly error message
    return { isValid: false, message: 'Phone number parsing error. Please check the format.' };
  }
};

/**
 * Validates a Sri Lankan address.
 *
 * @param {Object} address - The address object.
 * @param {string} address.line1 - The primary address line.
 * @param {string} [address.line2] - The secondary address line.
 * @param {string} address.city - The city name.
 * @param {string} address.district - The district name.
 * @param {string} address.postalCode - The postal code (must be 5 digits).
 * @returns {Promise<Object>} An object with:
 *   - isValid {boolean}: Whether the address is valid.
 *   - errors {Array<string>}: Any error messages.
 *   - suggestions {Array<string>}: Suggestions for correcting the address.
 *   - standardized {Object}: The standardized address fields.
 *   - geocode {Object}: Dummy geocoding data (latitude & longitude).
 */
export const validateAddress = async ({ line1, line2, city, district, postalCode }) => {
  const errors = [];
  const suggestions = [];

  // Check for required fields
  if (!line1 || typeof line1 !== 'string' || !line1.trim()) {
    errors.push("Address line1 is required.");
  }
  if (!city || typeof city !== 'string' || !city.trim()) {
    errors.push("City is required.");
  }
  if (!district || typeof district !== 'string' || !district.trim()) {
    errors.push("District is required.");
  }
  if (!postalCode || !/^\d{5}$/.test(postalCode)) {
    errors.push("Postal code must be exactly 5 digits.");
  }

  // Mapping of Sri Lankan districts to their provinces (used as 'state')
  const districtToProvince = {
    "Colombo": "Western Province",
    "Gampaha": "Western Province",
    "Kalutara": "Western Province",
    "Kandy": "Central Province",
    "Matale": "Central Province",
    "Nuwara Eliya": "Central Province",
    "Galle": "Southern Province",
    "Matara": "Southern Province",
    "Hambantota": "Southern Province",
    "Jaffna": "Northern Province",
    "Kilinochchi": "Northern Province",
    "Mannar": "Northern Province",
    "Vavuniya": "Northern Province",
    "Mullaitivu": "Northern Province",
    "Batticaloa": "Eastern Province",
    "Ampara": "Eastern Province",
    "Trincomalee": "Eastern Province",
    "Kurunegala": "North Western Province",
    "Puttalam": "North Western Province",
    "Anuradhapura": "North Central Province",
    "Polonnaruwa": "North Central Province",
    "Badulla": "Uva Province",
    "Moneragala": "Uva Province",
    "Ratnapura": "Sabaragamuwa Province",
    "Kegalle": "Sabaragamuwa Province"
  };

  let state = null;
  if (district && district.trim() in districtToProvince) {
    state = districtToProvince[district.trim()];
  } else {
    errors.push("Invalid district provided. Please provide a valid Sri Lankan district.");
    suggestions.push(`Valid districts include: ${Object.keys(districtToProvince).join(', ')}`);
  }

  // Determine if the address is valid
  const isValid = errors.length === 0;

  // Build the standardized address if valid
  let standardized = {};
  if (isValid) {
    standardized = {
      line1: line1.trim(),
      line2: line2 ? line2.trim() : "",
      city: city.trim(),
      state, // Inferred from the district
      zipCode: postalCode.trim()
    };
  }

  // try {
  //   // Obtain geocoding data using the provided address details
  //   geocode = await getGeocode({ line1, city, district, postalCode });
  // } catch (err) {
  //   // Handle error from geocoding API if necessary
  //   errors.push("Unable to obtain geolocation for the address.");
  // }

  return {
    isValid,
    errors,
    suggestions,
    standardized,
    // geocode
  };
};

const getGeocode = async ({ line1, city, district, postalCode, country = 'LK' }) => {
  // Construct a full address string
  const address = `${line1}, ${city}, ${district}, ${postalCode}, ${country}`;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Your API key from Google Cloud Console

  // Construct the API URL
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === 'OK') {
      // Take the first result from the geocoding response
      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      throw new Error(`Geocoding API error: ${response.data.status}`);
    }
  } catch (error) {
    console.error("Error fetching geocode: ", error.message);
    throw error;
  }
};