import express from 'express';
import { getSymptomSuggestions, smartSchedule, conversationalAI } from '../controllers/aiController.js';
import { aiLimiter } from '../middleware/rateLimiters.js';
import { validateAIChat, validateAISchedule, validateAISymptoms } from '../middleware/validators.js';

const aiRouter = express.Router();

// AI routes
aiRouter.post('/check-symptoms', aiLimiter, validateAISymptoms, getSymptomSuggestions);
aiRouter.post('/chat', aiLimiter, validateAIChat, conversationalAI);
aiRouter.post('/smart-schedule', aiLimiter, validateAISchedule, smartSchedule);

export default aiRouter;
