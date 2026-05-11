import 'dotenv/config';
import mongoose from 'mongoose';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log('Users in DB:', users.length);
  users.forEach(u => console.log(' -', u.email, '|', u.role, '| password hash:', u.password?.slice(0, 20) + '...'));
  await mongoose.disconnect();
})();
