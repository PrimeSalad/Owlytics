import { Router } from 'express';
import {
  listStudents, createStudent, importStudents,
  getStudent, updateStudent, deleteStudent, getStudentQR,
} from '../controllers/student.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../middleware/upload';

export const studentRouter = Router();

studentRouter.use(requireAuth);

studentRouter.get('/', requireRole('Secretary', 'Officer', 'President'), listStudents);
studentRouter.post('/', requireRole('Secretary'), createStudent);
studentRouter.post('/import', requireRole('Secretary'), upload.single('file'), importStudents);
studentRouter.get('/:id', requireRole('Secretary', 'Officer', 'President', 'Attendance'), getStudent);
studentRouter.patch('/:id', requireRole('Secretary'), updateStudent);
studentRouter.delete('/:id', requireRole('Secretary'), deleteStudent);
studentRouter.get('/:id/qr', requireRole('Secretary', 'Attendance'), getStudentQR);
