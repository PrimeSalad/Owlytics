import { Router } from 'express';
import { getSections, getSectionById, getCourses, getSectionsByYear } from '../controllers/section.controller';
import { requireAuth } from '../middleware/requireAuth';

export const sectionRouter = Router();

sectionRouter.use(requireAuth);

// Get all available sections (with optional filters)
sectionRouter.get('/', getSections);

// Get section by ID
sectionRouter.get('/:id', getSectionById);

// Get courses
sectionRouter.get('/api/courses', getCourses);

// Get sections by academic year
sectionRouter.get('/year/:yearLevel', getSectionsByYear);
