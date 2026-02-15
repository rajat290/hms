import express from 'express';
import { getSymptomSuggestions, smartSchedule } from '../controllers/aiController.js';
import authUser from '../middleware/authUser.js';

const aiRouter = express.Router();

// AI routes
aiRouter.post('/check-symptoms', getSymptomSuggestions);
aiRouter.post('/smart-schedule', smartSchedule);

export default aiRouter;
