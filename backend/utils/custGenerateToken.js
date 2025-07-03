import jwt from 'jsonwebtoken';

const custGenerateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email
  };

  // Generate access and refresh tokens with different secrets and expiration times.
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

  return { accessToken, refreshToken };
};

const custVerifyToken = (token, type = 'access') => {
  try {
    const secret = type === 'access' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

export { custGenerateToken, custVerifyToken };
