import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

import { validateAddress, validatePhone } from '../utils/customerValidation.js';
// import { sendNotification } from '../services/notificationService';
import * as stripeService from '../services/stripeService.js';
import logger from '../utils/logger.js';
import mongoose from "mongoose";

// TODO:
// use sendEmail instead of sendNotification 
// Payment Method Function to be finalized after stripe integration

// Get the customer profile
export const getCustomerProfile = async (req, res) => {
  try {
    // Find user by id but exclude sensitive information
    const customer = await Customer.findById(req.user.id)
      .select('-passwordHash -__v -failedLoginAttempts -accountLocked -lockUntil')
      .lean(); // return plain JavaScript objects instead of Mongooses Documents

    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get counts of orders for profile metrics
    const orderCounts = await Order.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(customer._id) } },
      { $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format order counts into user-friendly object
    const orderMetrics = {
      total: 0,
      completed: 0,
      inProgress: 0,
      cancelled: 0
    };

    orderCounts.forEach(status => {
      orderMetrics.total += status.count;
      if (status._id === 'delivered') orderMetrics.completed += status.count;
      else if (status._id === 'cancelled') orderMetrics.cancelled += status.count;
      else orderMetrics.inProgress += status.count;
    });

    logger.info(`User profile fetched of the customer ${customer.firstName}`);

    res.json({
        customer,
        orderMetrics,
        lastLogin: customer.lastLogin
    });
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`, { userId: req.user.id, error });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update the customer profile
export const updateCustomerProfile = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
  try {
    const { firstName, lastName, phone, preferences } = req.body;
      
      const updateData = {};
      
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      
      if (phone) {
        // Validate phone
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: phoneValidation.message
          });
        }
        
        // Check if phone is already in use by another user
        const existingUser = await Customer.findOne({ 
          phone, 
          _id: { $ne: req.user.id } 
        });
        
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'This phone number is already in use'
          });
        }
        
        updateData.phone = phone;
      }
      
      if (preferences) {
        // Validate preferences structure
        const validPreferenceKeys = [
          'notifications',
          'substitutionPreference'
        ];
        
        const invalidKeys = Object.keys(preferences).filter(
          key => !validPreferenceKeys.includes(key)
        );
        
        if (invalidKeys.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid preference keys: ${invalidKeys.join(', ')}`
          });
        }
        
        // Update each preference separately to avoid overwriting all preferences
        if (preferences.notifications) {
          updateData['preferences.notifications'] = preferences.notifications;
        }
        
        if (preferences.substitutionPreference) {
          if (!['refund', 'shopper_choice', 'contact_me'].includes(preferences.substitutionPreference)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid substitution preference'
            });
          }
          updateData['preferences.substitutionPreference'] = preferences.substitutionPreference;
        }
      }
      
      const updatedUser = await Customer.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-passwordHash -failedLoginAttempts -accountLocked -lockUntil');
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info(`${updatedUser.firstName}'s profile updated successfully`);
      
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phone: updatedUser.phone,
            preferences: updatedUser.preferences,
            emailVerified: updatedUser.emailVerified
          }
        }
      });
  } catch (error) {
    logger.error(`Error updating profile: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
    });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required for account deletion' });
  }

  try {
    // Retrieve the customer using the authenticated user's ID
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password is incorrect' });
    }

    // Check if customer has any ongoing orders (using customerId in the Order model)
    const ongoingOrders = await Order.countDocuments({
      customerId: req.user.id,
      orderStatus: { $nin: ['delivered', 'cancelled'] }
    });

    if (ongoingOrders > 0) {
      return res.status(400).json({ 
        sucess: false,
        message: 'Cannot delete account with ongoing orders. Please cancel or wait for orders to complete.'
      });
    }

    // Perform account deletion or anonymization (GDPR compliant)
    // Option 1: Complete deletion
    await Customer.findByIdAndDelete(req.user.id);
    
    // Option 2: Anonymize user data (GDPR compliant)
    // const anonymizedEmail = `deleted-${Date.now()}-${req.user.id}@example.com`;
    // await Customer.findByIdAndUpdate(req.user.id, {
    //   firstName: 'Deleted',
    //   lastName: 'User',
    //   email: anonymizedEmail,
    //   phoneNo: '0000000000', // Adjust if your field is named differently (e.g., phoneNo)
    //   passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
    //   addresses: [],
    //   paymentMethods: [],
    //   profilePicture: null, // if applicable in your model
    //   isActive: false,      // if applicable
    //   deletedAt: Date.now()
    // });

    // Anonymize user data in orders by updating orders where customerId matches
    await Order.updateMany(
      { customerId: req.user.id },
      { 
        $set: { 
          anonymizedUser: true,
          deliveryAddress: {
            line1: 'Deleted',
            city: 'Deleted',
            state: 'Deleted',
            zipCode: 'Deleted'
          }
        } 
      }
    );

    // Send confirmation email
    await sendNotification({
      type: 'email',
      template: 'account-deleted',
      recipient: customer.email,
      data: {
        name: customer.firstName,
        time: new Date().toLocaleString()
      }
    });

    res.json({ sucess: true, message: 'Account deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting account: ${error.message}`, { userId: req.user.id, error });
    res.status(500).json({ sucess: false, message: 'Server error', error: error.message });
  }
}


// ----------  Address Management ---------- //

// Get all addresses of a customer
export const getCustomerAddresses = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).select('addresses');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    logger.info(`${customer.firstName}'s addresses are shown successfully`);

    return res.status(200).json({
        success: true,
        data: { addresses: customer.addresses }
      });
  } catch (error) {
    logger.error(`Error fetching addresses: ${error.message}`, { userId: req.user.id, error });
    return res.status(500).json({
        success: false,
        message: 'Failed to fetch addresses'
    });
  }
};

// Add a new address
export const addAddress = async (req, res) => {
    try {
        const { type, line1, line2, city, district, postalCode, isDefault } = req.body;

        // Validate address with external service
        const validationResponse = await validateAddress({ line1, line2, city, district, postalCode });

        if (!validationResponse.isValid) {
          return res.status(400).json({ 
              message: 'Invalid address', 
              errors: validationResponse.errors,
              suggestions: validationResponse.suggestions
          });
        }

        const newAddress = {
            // userId: req.user.id,
            type: type || 'home',
            line1: validationResponse.standardized.line1 || line1,
            line2: validationResponse.standardized.line2 || line2,
            city: validationResponse.standardized.city || city,
            district: validationResponse.standardized.state || district,
            postalCode: validationResponse.standardized.zipCode || postalCode,
            isDefault: isDefault || false,
            // location: {
            //     type: 'Point',
            //     coordinates: [
            //         validationResponse.geocode.longitude,
            //         validationResponse.geocode.latitude
            //     ]
            // }
        };

        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Before adding the new address, check for duplicates
        const duplicateAddress = customer.addresses.some(addr => 
          addr.line1 === newAddress.line1 &&
          addr.line2 === newAddress.line2 &&
          addr.city === newAddress.city &&
          addr.district === newAddress.district &&
          addr.postalCode === newAddress.postalCode &&
          addr.type === newAddress.type
        );

        if (duplicateAddress) {
          return res.status(409).json({
            success: false,
            message: 'An address with the same details already exists'
          });
        }

        // If setting as default, unset any existing default
        if (newAddress.isDefault || customer.addresses.length === 0) {
            // Set all other addresses to non-default
            customer.addresses.forEach(addr => {
                addr.isDefault = false;
            });
            newAddress.isDefault = true;
        }

        // Add the new address
        customer.addresses.push(newAddress);
        await customer.save();

        logger.info(`Address added successfully for ${customer.firstName}`);

        res.status(201).json({ success: true, message: 'Address added successfully',
            data: {
              address: newAddress
            } 
        });
    } catch (error) {
        logger.error(`Error adding address: ${error.message}`, { userId: req.user.id, error });
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Update an existing address
export const updateAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const { type, line1, line2, city, district, postalCode, isDefault } = req.body;
    
        // Find the customer document using the authenticated user's id
        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    
        // Find the address in the embedded addresses array by its id
        const address = customer.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
    
        // Validate the provided address data using an external address validator
        const validationResponse = await validateAddress({ line1, line2, city, district, postalCode });
        if (!validationResponse.isValid) {
            return res.status(400).json({
            message: 'Invalid address',
            errors: validationResponse.errors,
            suggestions: validationResponse.suggestions
            });
        }
    
        // If setting as default, unset any existing default address
        if (isDefault) {
            customer.addresses.forEach(addr => {
                addr.isDefault = false;
            });
            address.isDefault = true;
        }
    
        // Update the address fields using validated/standardized data
        address.type = type || address.type;
        address.line1 = validationResponse.standardized.line1 || line1;
        address.line2 = validationResponse.standardized.line2 || line2;
        address.city = validationResponse.standardized.city || city;
        address.state = validationResponse.standardized.state || state;
        address.zipCode = validationResponse.standardized.zipCode || zipCode;
        // address.location = {
        //     type: 'Point',
        //     coordinates: [
        //     validationResponse.geocode.longitude,
        //     validationResponse.geocode.latitude
        //     ]
        // };
        address.updatedAt = new Date();
    
        // Save the updated customer document
        await customer.save();

        logger.info(`Address updated successfully for ${customer.firstName}`);
    
        res.json({ success: true, address, message: 'Address updated successfully' });
    } catch (error) {
        logger.error(`Error updating address: ${error.message}`, {
            userId: req.user.id,
            addressId: req.params.id,
            error
        });
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Delete an Address
export const deleteAddress = async (req, res) => {
    try {
        // Retrieve the customer document using the authenticated user's id
        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    
        // Locate the address subdocument in the customer's addresses array
        const address = customer.addresses.id(req.params.addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
    
        // If the address is set as default, determine a new default if other addresses exist
        if (address.isDefault) {
            // Remove the address first
            customer.addresses.pull(address._id);
            // If there are any addresses remaining, set the first one as the new default
            if (customer.addresses.length > 0) {
              customer.addresses[0].isDefault = true;
            }
        } else {
            // Otherwise, just remove the address
            // address.remove();
            customer.addresses.pull(address._id);
        }
    
        // Save the updated customer document
        await customer.save();

        logger.info(`Address removed successfully for ${customer.firstName}`);
    
        res.json({ success: true, message: 'Address removed successfully' });
    } catch (error) {
        logger.error(`Error deleting address: ${error.message}`, {
            userId: req.user.id,
            addressId: req.params.id,
            error
        });
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};


// ----------  Payment Methods Management ---------- //

// Get all customer payment methods
export const getPaymentMethods = async (req, res) => {
    try {
      // Find the customer by id and select only the paymentMethods field
        const user = await Customer.findById(req.user.id).select('paymentMethods');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json(user.paymentMethods);
    } catch (error) {
      logger.error(`Error fetching payment methods: ${error.message}`, { userId: req.user.id, error });
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add a new payment method ------------------------------------------------------------- TODO
export const addPaymentMethod = async (req, res) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { 
    paymentMethodId, // From payment gateway (e.g., Stripe)
    isDefault,
    cardholderName,
  } = req.body;

  try {
    // Retrieve payment method details from Stripe
    const paymentMethodDetails = await stripeService.retrievePaymentMethod(paymentMethodId);
    if (!paymentMethodDetails) {
        return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // Retrieve the customer document
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If setting as default, unset any existing default payment method in the embedded array
    if (isDefault) {
      customer.paymentMethods.forEach(pm => {
        pm.isDefault = false;
      });
    }

    // Create the new payment method object using details from Stripe
    const newPaymentMethod = {
      type: paymentMethodDetails.type, // e.g., 'card'
      lastFour: paymentMethodDetails.card.last4,
      expiryMonth: paymentMethodDetails.card.exp_month,
      expiryYear: paymentMethodDetails.card.exp_year,
      cardholderName: cardholderName || paymentMethodDetails.billing_details.name,
      isDefault: isDefault || false,
      stripeCustomerId: paymentMethodId // Store the gateway identifier for future reference
    };

    // Push the new payment method into the customer's paymentMethods array
    customer.paymentMethods.push(newPaymentMethod);
    await customer.save();

    // Add payment method reference to user document
    // await Customer.findByIdAndUpdate(req.user.id, {
    //   $push: { paymentMethods: newPaymentMethod._id },
    //   updatedAt: Date.now()
    // });

    // Send notification for added payment method (security measure)
    await sendNotification({
      type: 'email',
      template: 'payment-method-added',
      recipient: req.user.email,
      data: {
        name: req.user.firstName,
        cardLast4: paymentMethodDetails.card.last4,
        cardBrand: paymentMethodDetails.card.brand,
        time: new Date().toLocaleString()
      }
    });

    // Remove sensitive payment gateway id from the response
    const responsePaymentMethod = { ...newPaymentMethod };
    delete responsePaymentMethod.stripeCustomerId;

    res.status(201).json({
      success: true,
      paymentMethod: responsePaymentMethod,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    logger.error(`Error adding payment method: ${error.message}`, { userId: req.user.id, error });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update a payment method (limited fields)
export const updatePaymentMethod = async (req, res) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { isDefault, cardholderName } = req.body;

  try {
    // Retrieve the customer document using the authenticated user's id
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Locate the payment method subdocument in the customer's paymentMethods array
    const paymentMethod = customer.paymentMethods.id(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    // If setting as default, unset any existing default
    if (isDefault) {
      customer.paymentMethods.forEach(pm => {
        pm.isDefault = false;
      });
      paymentMethod.isDefault = true;
    } else if (isDefault === false) {
      paymentMethod.isDefault = false;
    }

    // Update cardholderName if provided
    if (cardholderName) {
      paymentMethod.cardholderName = cardholderName;
    }

    // Save the updated customer document
    await customer.save();

    // Prepare response data and remove sensitive payment gateway information
    const responsePaymentMethod = paymentMethod.toObject();
    delete responsePaymentMethod.stripeCustomerId;

    res.json({
      success: true,
      paymentMethod: responsePaymentMethod,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating payment method: ${error.message}`, { userId: req.user.id, paymentMethodId: req.params.id, error });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete a payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    // Retrieve the customer document using the authenticated user's ID
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Locate the payment method subdocument in the customer's paymentMethods array
    const paymentMethod = customer.paymentMethods.id(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    // Detach the payment method from the payment gateway (e.g., Stripe)
    await stripeService.detachPaymentMethod(paymentMethod.stripeCustomerId);

    // If deleting the default payment method, set a new default if other methods exist
    if (paymentMethod.isDefault) {
      // Remove the payment method
      paymentMethod.remove();
      // If there are remaining payment methods, set the first one as default
      if (customer.paymentMethods.length > 0) {
        customer.paymentMethods[0].isDefault = true;
      }
    } else {
      // Simply remove the payment method from the array
      paymentMethod.remove();
    }

    // Save the updated customer document
    await customer.save();


    // Send notification for removed payment method (security measure)
    // await sendNotification({
    //   type: 'email',
    //   template: 'payment-method-removed',
    //   recipient: req.user.email,
    //   data: {
    //     name: req.user.firstName,
    //     cardLast4: paymentMethod.lastFour,
    //     cardBrand: paymentMethod.brand,
    //     time: new Date().toLocaleString()
    //   }
    // });

    res.json({ success: true, message: 'Payment method removed successfully' });
  } catch (error) {
    logger.error(`Error deleting payment method: ${error.message}`, { userId: req.user.id, paymentMethodId: req.params.id, error });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get user notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id)
      .select('preferences.notifications email phoneNo');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      email: customer.email,
      phone: customer.phoneNo,
      preferences: customer.preferences.notifications
    });
  } catch (error) {
    logger.error(`Error fetching notification preferences: ${error.message}`, { userId: req.user.id, error });
    res.status(500).json({ success: true, message: 'Server error', error: error.message });
  }
};

// Update user notification preferences
export const updateNotificationPreferences = async (req, res) => {
  const { notifications } = req.body;

  try {
    // Retrieve the customer document using the authenticated user's ID
    const user = await Customer.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update notification preferences
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...notifications
    };
    
    await user.save();

    res.json({
      success: false,
      preferences: user.preferences.notifications,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating notification preferences: ${error.message}`, { userId: req.user.id, error });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user order history
// export const getUserOrders = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const status = req.query.status || null;
//     const skip = (page - 1) * limit;

//     // Build query
//     const query = { userId: req.user.id };
//     if (status) {
//       query.orderStatus = status;
//     }

//     // Execute query with pagination
//     const orders = await Order.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate('storeId', 'name logo')
//       .select('orderNumber storeId items subtotal total orderStatus estimatedDeliveryTime createdAt');

//     // Get total count for pagination
//     const totalOrders = await Order.countDocuments(query);

//     res.json({
//       orders,
//       pagination: {
//         total: totalOrders,
//         page,
//         limit,
//         pages: Math.ceil(totalOrders / limit)
//       }
//     });
//   } catch (error) {
//     logger.error(`Error fetching user orders: ${error.message}`, { userId: req.user.id, error });
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };