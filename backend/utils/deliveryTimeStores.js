
// Calculate traffic multiplier based on location and time
// Could integrate with external traffic API
export async function getTrafficMultiplier(latitude, longitude, requestTime){
    const hour = requestTime.getHours();
    const dayOfWeek = requestTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Define rush hours (weekdays 7-9 AM and 4-7 PM)
    const isWeekdayMorningRush = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 7 && hour < 9;
    const isWeekdayEveningRush = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 16 && hour < 19;
    
    // Weekend busy hours (11 AM - 4 PM)
    const isWeekendBusy = (dayOfWeek === 0 || dayOfWeek === 6) && hour >= 11 && hour < 16;
    
    if (isWeekdayMorningRush || isWeekdayEveningRush) {
        return 1.4; // 40% longer during rush hour
    } else if (isWeekendBusy) {
        return 1.25; // 25% longer during weekend busy times
    } else if (hour >= 22 || hour < 6) {
        return 0.8; // 20% faster during night hours
    } else {
        return 1.0; // Standard traffic conditions
    }
}

// Get shopper availability based on time
export async function getShopperAvailability(requestTime) {
    // In a production system, this would query active shoppers in the area
    // For this example, we'll simulate shopper availability patterns
    
    const hour = requestTime.getHours();
    const dayOfWeek = requestTime.getDay();
    
    // More shoppers during peak hours, fewer during off-hours
    if (hour >= 10 && hour < 20) {
      return 1.0; // Good availability
    } else if ((hour >= 8 && hour < 10) || (hour >= 20 && hour < 22)) {
      return 1.2; // Moderate availability (20% longer wait)
    } else {
      return 1.5; // Low availability (50% longer wait)
    }
}
  
// Check if a store is currently open
export function isOpenNow(operatingHours, currentDay, hour, minute) {
    if (!operatingHours || !operatingHours[currentDay]) {
        return false;
    }

    const dayHours = operatingHours[currentDay];

    if (!dayHours.open || !dayHours.close) {
        return false;
    }

    // Parse opening and closing times
    const openParts = dayHours.open.split(':');
    const closeParts = dayHours.close.split(':');

    if (openParts.length < 2 || closeParts.length < 2) {
        return false;
    }

    const openHour = parseInt(openParts[0]);
    const openMinute = parseInt(openParts[1]);
    const closeHour = parseInt(closeParts[0]);
    const closeMinute = parseInt(closeParts[1]);

    // Convert current time to minutes since midnight
    const currentMinutes = (hour * 60) + minute;

    // Convert open/close times to minutes since midnight
    const openMinutes = (openHour * 60) + openMinute;
    const closeMinutes = (closeHour * 60) + closeMinute;

    // Handle standard case where opening time is before closing time
    if (openMinutes < closeMinutes) {
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }
    // Handle case where store closes after midnight
    else {
        return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
}
  
// Calculate estimated delivery time based on multiple factors
export function calculateDeliveryTime({ 
    distance, 
    cartSize, 
    trafficMultiplier, 
    shopperAvailability,
    storeRating,
    timeOfDay,
    storeId 
}) {
    // Base times in minutes
    const basePickingTimePerItem = 2; // 2 minutes per item for picking
    const baseCheckoutTime = 10; // 10 minutes for checkout and packaging
    const baseDeliverySpeed = 2; // km per 5 minutes (or 24 km/h)

    // Adjust picking time based on store efficiency (using store rating as a proxy)
    const storeEfficiencyFactor = 1.5 - (storeRating / 5 * 0.5); // 1.0 (best) to 1.5 (worst)

    // Calculate picking time
    const pickingTime = cartSize * basePickingTimePerItem * storeEfficiencyFactor;

    // Calculate checkout and handoff time
    const checkoutTime = baseCheckoutTime;

    // Calculate delivery drive time
    const deliveryDriveTime = (distance / baseDeliverySpeed) * 5 * trafficMultiplier;

    // Factor in shopper availability (queue time)
    const shopperQueueTime = calculateQueueTime(cartSize, timeOfDay, storeId) * shopperAvailability;

    // Sum all components
    const totalEstimatedTime = pickingTime + checkoutTime + deliveryDriveTime + shopperQueueTime;

    // Add buffer time (15% for small orders, 10% for large orders)
    const bufferMultiplier = cartSize < 20 ? 1.15 : 1.10;
    const finalEstimate = totalEstimatedTime * bufferMultiplier;

    return Math.ceil(finalEstimate); // Round up to nearest minute
}

// Calculate estimated queue time before a shopper picks up the order
export function calculateQueueTime(cartSize, timeOfDay, storeId) {
// In a real implementation, this would query the order queue system
// For simplicity, we'll use time-based patterns

const hour = timeOfDay.getHours();
const dayOfWeek = timeOfDay.getDay();

// Base queue time
let queueTime = 5; // 5 minutes base

// Peak hours adjustment
if ((hour >= 11 && hour < 14) || (hour >= 17 && hour < 20)) {
    queueTime += 10; // Additional 10 minutes during lunch and dinner rushes
}

// Weekend adjustment
if (dayOfWeek === 0 || dayOfWeek === 6) {
    queueTime += 5; // Additional 5 minutes on weekends
}

return queueTime;
}

// Format delivery time estimate into user-friendly time windows
export function formatDeliveryTimeWindow(estimatedMinutes, requestTime) {
// Calculate the estimated delivery time
const deliveryTime = new Date(requestTime);
deliveryTime.setMinutes(deliveryTime.getMinutes() + estimatedMinutes);

// Round up to the nearest 15 minutes for the end of the window
const roundedMinutes = Math.ceil(deliveryTime.getMinutes() / 15) * 15;
const endTime = new Date(deliveryTime);
endTime.setMinutes(roundedMinutes);
if (roundedMinutes === 60) {
    endTime.setMinutes(0);
    endTime.setHours(endTime.getHours() + 1);
}

// Create a 30-minute window with the end time as the "by" time
const startTime = new Date(endTime);
startTime.setMinutes(startTime.getMinutes() - 30);

// Format times in "HH:MM AM/PM" format
const formatTimeString = (date) => {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} ${ampm}`;
};

// Calculate the human-readable estimate (e.g., "45-60 minutes")
const estimateLower = Math.floor(estimatedMinutes / 15) * 15;
const estimateUpper = Math.ceil(estimatedMinutes / 15) * 15;
let estimate;

if (estimateLower === estimateUpper) {
    estimate = `in ${estimateLower} min`;
} else {
    estimate = `in ${estimateLower}-${estimateUpper} min`;
}

// Return both the window and the raw earliest delivery time
return {
    estimate,
    timeWindow: `${formatTimeString(startTime)} - ${formatTimeString(endTime)}`,
    earliestTime: new Date(requestTime.getTime() + estimatedMinutes * 60000)
};
}