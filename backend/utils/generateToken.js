import jwt from "jsonwebtoken";

const generateToken = (storeId) => {
  return jwt.sign({ storeId }, process.env.JWT_SECRET, { expiresIn: "10m" });
};

generateToken.verify = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export default generateToken;
