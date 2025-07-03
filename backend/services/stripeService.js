// stripeService.js
import Stripe from 'stripe';
import logger from '../utils/logger.js';

// Initialize the Stripe client with your secret key and API version.
// Ensure that you have STRIPE_SECRET_KEY defined in your environment variables.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15', // Use the appropriate API version.
  // You can also set additional options like timeout here if needed.
});

/**
 * Retrieve a payment method by its ID.
 * @param {string} paymentMethodId - The ID of the payment method.
 * @returns {Promise<object|null>} - Returns the payment method object or null if retrieval fails.
 */
export const retrievePaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    logger.error(`Stripe Error in retrievePaymentMethod: ${error.message}`);
    // Optionally, you could throw the error instead of returning null.
    return null;
  }
};

/**
 * Create a new Payment Intent.
 * This function is useful when you want to process a payment.
 *
 * @param {number} amount - The amount to charge in the smallest currency unit (e.g., cents).
 * @param {string} currency - The currency code (e.g., 'usd').
 * @param {string} customerId - The Stripe customer ID.
 * @param {string} paymentMethodId - The payment method ID to charge.
 * @returns {Promise<object>} - Returns the created PaymentIntent object.
 */
export const createPaymentIntent = async (amount, currency, customerId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true, // Use this if you're charging a customer without their direct interaction.
      confirm: true,     // Automatically confirm the PaymentIntent.
    });
    return paymentIntent;
  } catch (error) {
    logger.error(`Stripe Error in createPaymentIntent: ${error.message}`);
    throw error;
  }
};

/**
 * Attach a payment method to a customer.
 * This is useful when you want to save a payment method for future use.
 *
 * @param {string} customerId - The Stripe customer ID.
 * @param {string} paymentMethodId - The payment method ID to attach.
 * @returns {Promise<object>} - Returns the attached PaymentMethod object.
 */
export const attachPaymentMethodToCustomer = async (customerId, paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    return paymentMethod;
  } catch (error) {
    logger.error(`Stripe Error in attachPaymentMethodToCustomer: ${error.message}`);
    throw error;
  }
};
