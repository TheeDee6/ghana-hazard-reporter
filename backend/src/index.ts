import express, { Request, Response, NextFunction} from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import mongoose from 'mongoose'
import logging from './config/logging'
import userRoutes from './router/user'
import dotenv from 'dotenv';
import config from './config/config'



dotenv.config();

const NAMESPACE = 'Server';
const router = express();


// Connecting to mongodb
mongoose.connect(config.mongo.url, config.mongo.options)
  .then(() => {
    logging.info(NAMESPACE, 'Connected to Database');
  })
  .catch((error) => {
    logging.error(NAMESPACE, 'Database connection error', error);
  });

// Log the request
router.use((req, res, next) => {
   logging.info(NAMESPACE, `METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

   res.on('finish', () => {
       //Log the response
       logging.info(NAMESPACE, `METHOD: [${req.method}] - URL: [${req.url}] - STATUS: [${res.statusCode}] - IP: [${req.socket.remoteAddress}]`);
   });

   next();
});

//Parse the body of the request 
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());


// Rules of the API
router.use((req, res, next) => {
   // Set CORS headers
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

   // Handle preflight requests
   if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
      return res.status(200).json({});
   }
   
   // Pass to next middleware or route handler
   next();
});


// Use Route
router.use('/api', userRoutes)

// Error handling for not found routes
router.use((req, res, next) =>{
   const error = new Error('Not found');
   return res.status(404).json({message: error.message});
});

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logging.error(NAMESPACE, error.message, error);
  return res.status(500).json({
    message: error.message
  });
});

const httpServer = http.createServer(router);

httpServer.listen(config.server.port, () => logging.info(NAMESPACE, `Server is running on ${config.server.hostname}:${config.server.port}`));
