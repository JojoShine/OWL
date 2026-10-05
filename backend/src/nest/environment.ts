import dotenv from 'dotenv';
if (process.env.NODE_ENV === 'production') dotenv.config({ path: '.env.production', override: false });
dotenv.config({ override: false });
