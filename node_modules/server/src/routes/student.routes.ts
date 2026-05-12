import { Router } from 'express';
import {
  listStudents, listSections, createStudent, importStudents, bulkCreateStudents,
  getStudent, updateStudent, deleteStudent, getStudentQR,
} from '../controllers/student.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../middleware/upload';

export const studentRouter = Router();

studentRouter.use(requireAuth);

studentRouter.get('/sections', requireRole('Secretary', 'Officer', 'President'), listSections);
studentRouter.get('/', requireRole('Secretary', 'Officer', 'President'), listStudents);
studentRouter.post('/', requireRole('President', 'Secretary'), createStudent);
studentRouter.post('/bulk', requireRole('President', 'Secretary'), bulkCreateStudents);
studentRouter.post('/import', requireRole('President', 'Secretary'), upload.single('file'), importStudents);
studentRouter.get('/:id', requireRole('Secretary', 'Officer', 'President', 'Attendance'), getStudent);
studentRouter.patch('/:id', requireRole('President', 'Secretary'), updateStudent);
studentRouter.delete('/:id', requireRole('President', 'Secretary'), deleteStudent);
studentRouter.get('/:id/qr', requireRole('President', 'Secretary', 'Attendance'), getStudentQR);
