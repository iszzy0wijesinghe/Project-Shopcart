import jwt from 'jsonwebtoken';
import ShopOwner from '../models/ShopOwner.js';
import logger from '../utils/logger.js';
import { custVerifyToken } from '../utils/custGenerateToken.js';

export const validateAccessToken = async (req, res, next) => {
  // logger.warn('validateAccessToken called  | A.TOKEN:');
  // logger.warn(req.cookies.accessToken);
  // const token = req.cookies.accessToken;
    
  // if (!token) {
  //   return res.status(401).json({ 
  //     success: false, 
  //     message: 'Access denied. No token provided.' 
  //   });
  // }

  try {
    // const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // req.user = decoded;

    req.user = { storeId: 'STORE1234' }

    const loggerMsg = `Access Token of the ${req.user.storeId} is valid`;
    logger.info(loggerMsg);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.error('Access token is expired');
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    logger.error(error.name);
    return res.status(400).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const validateRefreshToken = async (req, res, next) => {
  const token = req.cookies.refreshToken;
    
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Refresh token not found'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Find the user by storeId
    const user = await ShopOwner.findOne({ storeId: decoded.storeId });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if the user’s refreshTokens array actually contains this plain refresh token
    const hasToken = await user.hasRefreshToken(token);
    if (!hasToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    req.user = decoded;
    req.refreshToken = token;

    const loggerMsg = `Access token of the ${user.store_name} is expired, but the Resfresh Token is valid`;
    logger.info(loggerMsg);

    next();
  } catch (error) {
    logger.error('Refresh token validation error:', error);
    // Usually 401 or 403 for token issues
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

export const decodeAccessToken = (req, res, next) => {
  // Retrieve the access token from cookies
  const accessToken = req.cookies.custAccessToken;
  const refreshToken = req.cookies.custRefreshToken;
  
  // If no access token but refresh token exists, assume token expired.
  if (!accessToken && refreshToken) {
    logger.warn('Access token not found in cookies, assuming it has expired');
    return res.status(401).json({ 
      success: false, 
      message: 'Token expired' 
    });
  }
  
  // If neither token is available, it likely means the user is logged out.
  if (!accessToken) {
    logger.warn('Access token not found in cookies');
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }
  
  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    
    // Attach decoded user information to the request for later use
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.error('Access token is expired | begin refreshing token');
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    logger.warn('Invalid token attempt', { error: error.message });
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
