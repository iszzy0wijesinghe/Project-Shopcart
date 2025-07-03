const config = {
    DB_CONNECTION_STRING: process.env.MONGODB_URL,
    
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.PHONE_NUMBER_ID,
}

export default config;