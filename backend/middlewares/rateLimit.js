import rateLimit from "express-rate-limit";

// Rate limit for sensitive endpoints
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2, // Limit each IP to 5 requests per windowMs
  message: {
    message: "Too many attempts. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limit for general endpoints
const generalEndpointLimiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 100 requests per hour
  message: {
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { sensitiveEndpointLimiter, generalEndpointLimiter };
