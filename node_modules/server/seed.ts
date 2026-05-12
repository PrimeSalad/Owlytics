import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

(async () => {
  const MONGODB_URI = process.env.MONGODB_URI!;

  await mongoose.connect(MONGODB_URI);

  const hashed = await bcrypt.hash('admin123', 12);

  await mongoose.connection.collection('users').insertOne({
    studentId: '2024-0001',
    name: { first: 'Admin', last: 'President' },
    email: 'president@sms.com',
    password: hashed,
    role: 'President',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✅ Seed complete');
  console.log('   Email:    president@sms.com');
  console.log('   Password: admin123');

  await mongoose.disconnect();
})();
