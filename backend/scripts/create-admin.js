import db from '../database.js';
import { User } from '../models/User.js';

async function createAdminUser() {
  try {
    console.log('Checking for admin users...');

    // Check if admin user exists
    const existingAdmins = await db.allAsync('SELECT * FROM users WHERE role = ?', ['Admin']);

    if (existingAdmins.length > 0) {
      console.log('Admin users found:');
      existingAdmins.forEach(admin => {
        console.log(`- ${admin.username} (ID: ${admin.id})`);
      });
      console.log('\nYou can login with any of these admin accounts.');
      return;
    }

    console.log('No admin users found. Creating default admin user...');

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'Admin',
      canEdit: true,
      canView: 'all'
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n🔐 Login at http://localhost:5173 with these credentials to see the new admin features.');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();