import Store from '../models/Store.js';
import ProductStore from '../models/ProductStore.js';
import StorePromotion from '../models/StorePromotion.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import geolib from 'geolib';
import logger from '../utils/logger.js';
import { calculateDeliveryTime, getTrafficMultiplier, getShopperAvailability, isOpenNow, formatDeliveryTimeWindow } from '../utils/deliveryTimeStores.js';
import { query } from 'express-validator';

// Get all stores with optional filtering and pagination
export async function getAllStores(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 100, 
      search, 
      minDeliveryFee, 
      maxDeliveryFee, 
      isActive 
    } = req.query;

    // Build query
    const query = {};
    
    // Text search on store name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Delivery fee filters
    if (minDeliveryFee) query.deliveryFee = { $gte: parseFloat(minDeliveryFee) };
    if (maxDeliveryFee)
      query.deliveryFee = { 
        ...(query.deliveryFee || {}), 
        $lte: parseFloat(maxDeliveryFee) 
      };

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: '-__v',
      sort: { ratings: -1 }
    };

    const stores = await Store.paginate(query, options);

    // Get current date for promotion filtering
    const currentDate = new Date();
    
    // Enhance store data with promotions and pricing info
    const enhancedStores = await Promise.all(stores.docs.map(async (store) => {
      const storeObj = store.toObject();
      
      // Find active promotions for this store
      const promotions = await StorePromotion.find({
        storeId: store._id,
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
        displayOnStorefront: true
      }).sort({ value: -1 }).limit(3); // Get top 3 promotions by value
      
      // Format promotions for display
      const formattedPromotions = promotions.map(promo => {
        return {
          id: promo._id,
          type: promo.type,
          value: promo.value,
          description: promo.description,
          minimumPurchase: promo.minimumPurchase
        };
      });
      
      // Determine the main promo display text (like "$15 off" or "$5 off")
      let mainPromoDisplay = null;
      if (promotions.length > 0) {
        const topPromo = promotions[0];
        if (topPromo.type === 'amount_off') {
          mainPromoDisplay = `Rs.${topPromo.value}`;
        } else if (topPromo.type === 'percentage_off') {
          mainPromoDisplay = `${topPromo.value}%`;
        }
      }
      
      // Add pricing indicators
      // let pricingIndicator = null;
      // if (store.matchesInStorePrices) {
      //   pricingIndicator = "In-store prices";
      // } else if (store.pricingPrograms && store.pricingPrograms.length > 0) {
      //   const activePricingProgram = store.pricingPrograms.find(p => p.isActive);
      //   if (activePricingProgram) {
      //     pricingIndicator = activePricingProgram.displayText;
      //   }
      // }

      // const instorePrices = store.matchesInStorePrices;

      return {
        ...storeObj,
        promotions: formattedPromotions,
        mainPromoDisplay
        // instorePrices
      };
    }));

    // logger.info(`All | Fetched ${enhancedStores.length} stores for page ${stores.page} with limit ${stores.limit} and for |${search}| keyword`);
    logger.info(`All | Fetched ${enhancedStores.length} stores for |${search}| keyword`);

    res.status(200).json({
      status: 'success',
      results: enhancedStores.length,
      pagination: {
        currentPage: stores.page,
        totalPages: stores.totalPages,
        totalStores: stores.totalDocs
      },
      data: enhancedStores
    });
  } catch (err) {
    next(err);
  }
}

// Find nearby stores based on user's location
// export async function getNearbyStores(req, res, next) {
//   try {
//     const { 
//       latitude, 
//       longitude, 
//       // maxDistance = 10, // kilometers
//       limit = 100 
//     } = req.query;

//     if (!latitude || !longitude) {
//       return next(new Error('Please provide latitude and longitude'));
//     }

//     logger.info(`Finding Nearby Stores for the coordinates [ lat: ${latitude} | lon: ${longitude} ]`);

//     // Convert max distance to meters
//     // const maxDistanceMeters = parseFloat(maxDistance) * 1000;
//     const maxDistanceKm = 0.2;
//     const maxDistanceMeters = maxDistanceKm * 1000;

//     // Define customer's location as a GeoJSON Point
//     const customerPoint = {
//       type: "Point",
//       coordinates: [parseFloat(longitude), parseFloat(latitude)]
//     };

//     const nearbyStores = await Store.aggregate([
//       {
//         $geoNear: {
//           near: customerPoint,
//           distanceField: 'distance', // Distance in meters from customer's point to store's location
//           maxDistance: maxDistanceMeters, // e.g., 50,000 meters
//           spherical: true, // Accounts for Earth's curvature
//           key: "address.location", // Specify the field with the 2dsphere index to use
//         }
//       },
//       { 
//         $match: { 
//           isActive: true,
//           // serviceArea: {
//           //   $geoIntersects: {
//           //     $geometry: customerPoint // Filters stores where customer's point is in serviceArea
//           //   }
//           // }
//         } 
//       },
//       { 
//         $project: {
//           name: 1,
//           logo: 1,
//           deliveryFee: 1,
//           distance: { $divide: ['$distance', 1000] },
//           ratings: 1,
//           operatingHours: 1
//         } 
//       },
//       { 
//         $sort: { 
//           distance: 1, 
//           ratings: -1 
//         } 
//       },
//       { 
//         $limit: parseInt(limit) 
//       }
//     ]);

//     if (nearbyStores.length === 0) {
//       logger.warn(`No stores found nearby for the coordinates [ lat: ${latitude} | lon: ${longitude} ]`);
//       return next(new Error('No stores found nearby'));
//     }
//     logger.info(`Found ${nearbyStores.length} nearby stores for the coordinates [ lat: ${latitude} | lon: ${longitude} ]`);

//     res.status(200).json({
//       status: 'success',
//       results: nearbyStores.length,
//       data: nearbyStores
//     });
//   } catch (err) {
//     next(err);
//   }
// }

export async function getNearbyStores(req, res, next) {
  try {
    const { 
      latitude, 
      longitude,
      limit = 100,
      cartSize = 10, // Default assumption for cart size if not provided
      timeOfRequest = new Date(), // Current time if not specified
      filter = 'all'
    } = req.query;

    if (!latitude || !longitude) {
      // return next(new Error('Please provide latitude and longitude'));
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide latitude and longitude' 
      });
    }

    logger.info(`Finding Nearby Stores for [${latitude} | ${longitude} ]`);

    // Convert max distance to meters
    const maxDistanceKm = 100;
    const maxDistanceMeters = maxDistanceKm * 1000;

    // Define customer's location as a GeoJSON Point
    const customerPoint = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    const nearbyStores = await Store.aggregate([
      {
        $geoNear: {
          near: customerPoint,
          distanceField: 'distance', // Distance in meters from customer's point to store's location
          maxDistance: maxDistanceMeters,
          spherical: true, // Accounts for Earth's curvature
          key: "address.location", // Specify the field with the 2dsphere index to use
        }
      },
      { 
        $match: { 
          isActive: true,
        } 
      },
      { 
        $project: {
          name: 1,
          logo: 1,
          deliveryFee: 1,
          distance: { $divide: ['$distance', 1000] }, // Convert to km
          ratings: 1,
          operatingHours: 1,
          matchesInStorePrices: 1
        } 
      },
      { 
        $sort: { 
          distance: 1, 
          ratings: -1 
        } 
      },
      { 
        $limit: parseInt(limit) 
      }
    ]);

    if (nearbyStores.length === 0) {
      logger.warn(`No stores found nearby for the coordinates [ lat: ${latitude} | lon: ${longitude} ]`);
      // return next(new Error('No stores found nearby'));
      return res.status(400).json({ 
        success: false, 
        message: 'No stores found nearby' 
      });
    }
    
    // Get current day and time for operating hours check
    const requestTime = new Date(timeOfRequest);
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestTime.getDay()];
    const currentHour = requestTime.getHours();
    const currentMinute = requestTime.getMinutes();

    // logger.info(` --| Current time for delivery estimation: ${requestTime.toISOString()}`);
    // logger.info(` --| Current day: ${currentDay}, hour: ${currentHour}, minute: ${currentMinute}`);
    
    // Get traffic conditions for the area (could be from external API)
    const trafficMultiplier = await getTrafficMultiplier(latitude, longitude, requestTime);
    // logger.info(` --| Traffic multiplier for the area: ${trafficMultiplier}`);
    
    // Get shopper availability data
    const shopperAvailability = await getShopperAvailability(requestTime);
    // logger.info(` --| Shopper availability multiplier: ${shopperAvailability}`);
    // logger.info(` --| --------------------------------------------`);

    // Get current date for promotion filtering
    const currentDate = new Date();

    // Process each store, adding delivery estimates and promotion data
    let enhancedStores = await Promise.all(nearbyStores.map(async (store) => {
      // Check if store is open
      const isStoreOpen = isOpenNow(store.operatingHours, currentDay, currentHour, currentMinute);
      // logger.info(` --| Store ${store.name} is ${isStoreOpen ? 'open' : 'closed'} at the requested time`);
      
      // Calculate estimated delivery time only if store is open
      let deliveryEstimate = null;
      let deliveryTimeWindow = null;
      let earliestDeliveryTime = null;
      let rawDeliveryTime = null;
      
      if (isStoreOpen) {
        const timeEstimate = calculateDeliveryTime({
          distance: store.distance,
          cartSize: parseInt(cartSize),
          trafficMultiplier,
          shopperAvailability,
          storeRating: store.ratings?.average || 3,
          timeOfDay: requestTime,
          storeId: store._id
        });
        
        // Format time windows for frontend display
        rawDeliveryTime = timeEstimate;
        const { estimate, timeWindow, earliestTime } = formatDeliveryTimeWindow(timeEstimate, requestTime);
        deliveryEstimate = estimate;
        deliveryTimeWindow = timeWindow;
        earliestDeliveryTime = earliestTime;
      }

      // Find active promotions for this store
      const promotions = await StorePromotion.find({
        storeId: store._id,
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
        displayOnStorefront: true
      }).sort({ value: -1 }).limit(3);

      // Format promotions for display
      const formattedPromotions = promotions.map(promo => ({
          id: promo._id,
          type: promo.type,
          value: promo.value,
          description: promo.description,
          minimumPurchase: promo.minimumPurchase
      }));

      // Determine the main promo display text (like "$15 off" or "15%")
      let mainPromoDisplay = null;
      if (promotions.length > 0) {
        const topPromo = promotions[0];
        if (topPromo.type === 'amount_off') {
          mainPromoDisplay = `Rs.${topPromo.value}`;
        } else if (topPromo.type === 'percentage_off') {
          mainPromoDisplay = `${topPromo.value}%`;
        }
      }
      
      return {
        ...store,
        isOpen: isStoreOpen,
        deliveryEstimate,
        deliveryTimeWindow,
        earliestDeliveryTime,
        rawDeliveryTime,
        promotions: formattedPromotions,
        mainPromoDisplay
      };
    }));

    // Apply filter based on query parameter
    switch(filter) {
      case 'fastest':
        // Only include stores that are open and have a delivery estimate
        enhancedStores = enhancedStores.filter(store => store.isOpen && store.rawDeliveryTime !== null);
        // Sort by rawDeliveryTime ascending (fastest delivery first)
        enhancedStores.sort((a, b) => a.rawDeliveryTime - b.rawDeliveryTime);
        break;
      case 'offers':
        // Only include stores that have promotions
        enhancedStores = enhancedStores.filter(store => store.promotions && store.promotions.length > 0);
        // Sort by top promotion value descending (highest offer first)
        enhancedStores.sort((a, b) => {
          const promoA = a.promotions[0]?.value || 0;
          const promoB = b.promotions[0]?.value || 0;
          return promoB - promoA;
        });
        break;
      case 'instoreprices':
        // Only include stores that have in-store pricing available
        enhancedStores = enhancedStores.filter(store => store.matchesInStorePrices);
        break;
      default:
        // "all" filter or unknown filter: do nothing
        break;
    }

    logger.info(`Found ${enhancedStores.length} nearby stores for query { ${filter} }`);

    res.status(200).json({
      status: 'success',
      results: enhancedStores.length,
      data: enhancedStores
    });
    
  } catch (err) {
    next(err);
  }
}

// Get store details with featured products and categories
export async function getStoreDetails(req, res, next) {
  try {
    const storeId = req.params.storeId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return next(new Error('Invalid store ID'));
    }

    const store = await Store.findById(storeId)
      .populate({
        path: 'featuredItems',
        select: 'name price images brand',
        limit: 10
      });

    if (!store) {
      return next(new Error('Store not found'));
    }

    // Fetch top-level categories for the store
    const categories = await Category.find({ 
      storeId: storeId, 
      parentCategory: null 
    }).select('name image');

    // Get the count of products in the store
    const productCount = await ProductStore.countDocuments({ storeId: storeId });

    res.status(200).json({
      status: 'success',
      data: {
        store,
        categories,
        productCount
      }
    });
  } catch (err) {
    next(err);
  }
}

// Get featured products for a store
export async function getFeaturedProducts(req, res, next) {
  try {
    const storeId = req.params.storeId;
    const { limit = 10 } = req.query;

    const featuredProducts = await ProductStore.find({
      storeId: storeId,
      $or: [
        { isFeatured: true },
        { isPopular: true },
        { isRecommended: true }
      ]
    })
    .select('name price images brand isFeatured isPopular isRecommended')
    .limit(parseInt(limit));

    logger.info(`Fetched ${featuredProducts.length} featured products for store ID: ${storeId}`);

    res.status(200).json({
      status: 'success',
      results: featuredProducts.length,
      data: featuredProducts
    });
  } catch (err) {
    next(err);
  }
}
