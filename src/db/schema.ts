import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  role: text('role').notNull(), // 'parent' | 'admin'
  familyId: text('family_id').references(() => families.id),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Families
export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// School years
export const schoolYears = sqliteTable('school_years', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: integer('start_date').notNull(),
  endDate: integer('end_date').notNull(),
  requiredHours: integer('required_hours').notNull().default(50),
  hourlyRate: real('hourly_rate').notNull().default(20.0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

// Family participation tracking per year
export const familyYearStatus = sqliteTable(
  'family_year_status',
  {
    id: text('id').primaryKey(),
    familyId: text('family_id').notNull().references(() => families.id),
    schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    totalHours: real('total_hours').notNull().default(0),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    uniq: uniqueIndex('uniq_family_year_status_family_year').on(
      table.familyId,
      table.schoolYearId,
    ),
  }),
);

// Financial tracking per family per year
export const familyYearBalances = sqliteTable(
  'family_year_balances',
  {
    id: text('id').primaryKey(),
    familyId: text('family_id').notNull().references(() => families.id),
    schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
    hoursOwed: real('hours_owed').notNull().default(0),
    amountOwed: real('amount_owed').notNull().default(0),
    amountPaid: real('amount_paid').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    uniq: uniqueIndex('uniq_family_year_balances_family_year').on(
      table.familyId,
      table.schoolYearId,
    ),
  }),
);

// Task categories
export const taskCategories = sqliteTable('task_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
});

// Tasks
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  userId: text('user_id').notNull().references(() => users.id),
  categoryId: text('category_id').notNull().references(() => taskCategories.id),
  hours: real('hours').notNull(),
  date: integer('date').notNull(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Invitations
export const invitations = sqliteTable(
  'invitations',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    familyId: text('family_id').references(() => families.id), // null for admin invites
    token: text('token').notNull(),
    role: text('role').notNull().default('parent'),
    expiresAt: integer('expires_at').notNull(),
    usedAt: integer('used_at'),
    invitedBy: text('invited_by').notNull().references(() => users.id),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    uniqToken: uniqueIndex('uniq_invitations_token').on(table.token),
  }),
);


