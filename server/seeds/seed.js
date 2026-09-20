const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Policy = require('../models/Policy');
const Budget = require('../models/Budget');

// Import constants
const { DEFAULT_CATEGORIES, DEFAULT_POLICIES } = require('../config/constants');

const seedDatabase = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-management';
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB for seeding...\n');

    // ── Seed Categories ──
    console.log('Seeding categories...');
    const existingCategories = await Category.countDocuments();
    let categories = [];
    if (existingCategories === 0) {
      categories = await Category.insertMany(
        DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          isActive: true,
        }))
      );
      console.log(`  ✓ Created ${categories.length} categories`);
    } else {
      categories = await Category.find();
      console.log(`  ⏭ ${existingCategories} categories already exist, skipping`);
    }

    // ── Seed Policies ──
    console.log('Seeding policies...');
    const existingPolicies = await Policy.countDocuments();
    if (existingPolicies === 0) {
      const policies = [];
      for (const policyDef of DEFAULT_POLICIES) {
        const category = categories.find((c) => c.name === policyDef.categoryName);
        policies.push({
          name: policyDef.name,
          description: policyDef.description,
          categoryId: category ? category._id : null,
          maxAmount: policyDef.maxAmount,
          maxAmountPeriod: policyDef.maxAmountPeriod,
          allowedClasses: policyDef.allowedClasses || [],
          isActive: true,
        });
      }
      await Policy.insertMany(policies);
      console.log(`  ✓ Created ${policies.length} policies`);
    } else {
      console.log(`  ⏭ ${existingPolicies} policies already exist, skipping`);
    }

    // ── Seed Demo Users ──
    console.log('Seeding demo users...');
    const existingUsers = await User.countDocuments();
    if (existingUsers === 0) {
      // Create admin first
      const admin = await User.create({
        email: 'admin@expenseai.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Admin',
        role: 'admin',
        department: 'Administration',
      });
      console.log('  ✓ Created admin: admin@expenseai.com / admin123');

      // Create manager
      const manager = await User.create({
        email: 'manager@expenseai.com',
        password: 'manager123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'manager',
        department: 'Engineering',
      });
      console.log('  ✓ Created manager: manager@expenseai.com / manager123');

      // Create employees
      const emp1 = await User.create({
        email: 'john@expenseai.com',
        password: 'employee123',
        firstName: 'John',
        lastName: 'Smith',
        role: 'employee',
        department: 'Engineering',
        managerId: manager._id,
      });
      console.log('  ✓ Created employee: john@expenseai.com / employee123');

      const emp2 = await User.create({
        email: 'jane@expenseai.com',
        password: 'employee123',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'employee',
        department: 'Marketing',
        managerId: manager._id,
      });
      console.log('  ✓ Created employee: jane@expenseai.com / employee123');

      // Create sample budgets
      console.log('Seeding budgets...');
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const travelCat = categories.find((c) => c.name === 'Travel');
      const mealsCat = categories.find((c) => c.name === 'Meals & Entertainment');
      const officeCat = categories.find((c) => c.name === 'Office Supplies');

      await Budget.insertMany([
        {
          name: 'Travel Budget',
          categoryId: travelCat?._id,
          totalAmount: 10000,
          spentAmount: 0,
          period: { startDate: startOfMonth, endDate: endOfMonth },
          createdBy: admin._id,
        },
        {
          name: 'Meals Budget',
          categoryId: mealsCat?._id,
          totalAmount: 5000,
          spentAmount: 0,
          period: { startDate: startOfMonth, endDate: endOfMonth },
          createdBy: admin._id,
        },
        {
          name: 'Office Supplies Budget',
          categoryId: officeCat?._id,
          totalAmount: 8000,
          spentAmount: 0,
          period: { startDate: startOfMonth, endDate: endOfMonth },
          createdBy: admin._id,
        },
      ]);
      console.log('  ✓ Created 3 sample budgets');
    } else {
      console.log(`  ⏭ ${existingUsers} users already exist, skipping`);
    }

    console.log('\n✅ Database seeding completed!\n');
    console.log('Demo Accounts:');
    console.log('  Admin:    admin@expenseai.com    / admin123');
    console.log('  Manager:  manager@expenseai.com  / manager123');
    console.log('  Employee: john@expenseai.com     / employee123');
    console.log('  Employee: jane@expenseai.com     / employee123\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
