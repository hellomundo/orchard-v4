# Elementary School Volunteer Hours Management System
## Product Requirements Document

---

## Executive Summary

A web application that helps elementary schools manage family volunteer hour requirements. Each family must complete a set number of volunteer hours annually or pay a penalty fee. The system tracks volunteer tasks, calculates progress, manages yearly rollover, and provides administrative oversight.

**Core Users:**
- **Parents/Guardians**: Submit volunteer hours, track family progress
- **School Administrators**: Manage families, users, years, and view system-wide analytics

---

## System Architecture

### Tech Stack
- **Backend**: Node.js, TypeScript, NextJS framework
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Clerk
- **Frontend**: (To be determined - React recommended)

### Database Schema

```sql
-- User management
users (
  id TEXT PRIMARY KEY,           -- Clerk user ID
  email TEXT NOT NULL,
  role TEXT NOT NULL,            -- 'parent' | 'admin'
  family_id TEXT REFERENCES families(id),
  archived_at TIMESTAMP,         -- NULL = active user
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Family organization
families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  archived_at TIMESTAMP,         -- NULL = active family
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- School year management
school_years (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,            -- e.g., "2024-2025"
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  required_hours INTEGER NOT NULL DEFAULT 50,
  hourly_rate REAL NOT NULL DEFAULT 20.0,  -- Penalty rate per missing hour
  is_active BOOLEAN NOT NULL DEFAULT FALSE, -- Only one active at a time
  created_at TIMESTAMP NOT NULL
);

-- Family participation tracking per year
family_year_status (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  school_year_id TEXT NOT NULL REFERENCES school_years(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  total_hours REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  UNIQUE(family_id, school_year_id)
);

-- Financial tracking per family per year
family_year_balances (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  school_year_id TEXT NOT NULL REFERENCES school_years(id),
  hours_owed REAL NOT NULL DEFAULT 0,      -- Calculated: max(0, required - completed)
  amount_owed REAL NOT NULL DEFAULT 0,     -- Calculated: hours_owed * hourly_rate
  amount_paid REAL NOT NULL DEFAULT 0,     -- Admin-entered payment tracking
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(family_id, school_year_id)
);

-- Admin-managed task categories
task_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL
);

-- Individual volunteer tasks
tasks (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  school_year_id TEXT NOT NULL REFERENCES school_years(id),
  user_id TEXT NOT NULL REFERENCES users(id),     -- Who submitted the task
  category_id TEXT NOT NULL REFERENCES task_categories(id),
  hours REAL NOT NULL,                             -- In 0.25 increments
  date TIMESTAMP NOT NULL,                         -- When task was performed
  description TEXT,                                -- Optional details
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Invitation management
invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  family_id TEXT REFERENCES families(id),         -- NULL for admin invites
  token TEXT NOT NULL UNIQUE,                     -- Secure random token
  role TEXT NOT NULL DEFAULT 'parent',            -- 'parent' | 'admin'
  expires_at TIMESTAMP NOT NULL,                  -- 7 days from creation
  used_at TIMESTAMP,                              -- NULL = unused
  invited_by TEXT NOT NULL REFERENCES users(id),  -- Admin who sent invite
  created_at TIMESTAMP NOT NULL
);
```

### Caching Strategy

**School Year Caching:**
- Cache current school year at application level
- Invalidate on year changes (rare operation)
- Inject via middleware to avoid repeated DB calls

```typescript
// Application-level cache
let currentSchoolYearCache: SchoolYear | null = null
let cacheExpiry: Date | null = null

async function getCurrentSchoolYear(): Promise<SchoolYear> {
  if (currentSchoolYearCache && cacheExpiry && new Date() < cacheExpiry) {
    return currentSchoolYearCache
  }
  
  // Cache miss - query database
  const year = await db.select().from(schoolYears)
    .where(eq(schoolYears.isActive, true)).get()
  
  currentSchoolYearCache = year
  cacheExpiry = new Date(Date.now() + 3600000) // 1 hour
  return year
}
```

---

## Authentication & Authorization

### Clerk Integration
- **User Creation**: Webhook creates database record when Clerk user signs up
- **Role-Based Access**: Middleware checks user role for route protection
- **Family Association**: Users belong to families (except admins)

### Permission Model
- **Parents**: Can only see/edit their family's data and their own tasks
- **Admins**: Full system access, can manage all families and users
- **Archived Users**: Cannot login, but historical data preserved

### Middleware Stack
```typescript
app.use('*', clerkAuth)           // Clerk authentication
app.use('*', injectUser)          // Load user from database
app.use('*', injectSchoolYear)    // Cache current school year
app.use('/api/admin/*', requireAdmin)  // Admin route protection
```

---

## API Routes

### Public Routes
```
POST /api/webhooks/clerk          -- User creation webhook
GET  /api/invites/:token          -- Validate invitation token
POST /api/invites/:token/accept   -- Accept invitation & create account
```

### Parent Routes (Family-Scoped)
```
GET    /api/dashboard             -- Family progress summary
GET    /api/tasks                 -- Family's tasks for current year
POST   /api/tasks                 -- Submit new volunteer task
PUT    /api/tasks/:id             -- Edit own task
DELETE /api/tasks/:id             -- Delete own task
GET    /api/categories            -- Available task categories
```

### Admin Routes (Global Access)
```
-- Dashboard & Analytics
GET  /api/admin/dashboard         -- Weekly hours chart + overview
GET  /api/admin/dashboard/:year   -- Historical year data

-- Family Management
GET    /api/admin/families        -- List all families (active/archived)
POST   /api/admin/families        -- Create new family
PUT    /api/admin/families/:id/archive   -- Archive family
PUT    /api/admin/families/:id/restore   -- Restore archived family

-- User Management
GET    /api/admin/users           -- List all users
PUT    /api/admin/users/:id/archive      -- Archive user
PUT    /api/admin/users/:id/restore      -- Restore user

-- Invitation System
GET    /api/admin/invitations     -- List pending invitations
POST   /api/admin/invitations     -- Send new invitation
POST   /api/admin/invitations/:id/resend -- Resend invitation
DELETE /api/admin/invitations/:id -- Cancel invitation

-- School Year Management
GET    /api/admin/school-years    -- List all years
POST   /api/admin/school-years    -- Create new school year
PUT    /api/admin/school-years/:id/activate -- Set as current year
PUT    /api/admin/school-years/:id -- Update year settings

-- Task Categories
GET    /api/admin/categories      -- Manage task categories
POST   /api/admin/categories      -- Create category
PUT    /api/admin/categories/:id  -- Update category
DELETE /api/admin/categories/:id  -- Archive category

-- Financial Management
GET  /api/admin/balances          -- Current year financial overview
GET  /api/admin/balances/:year    -- Historical year balances
PUT  /api/admin/balances/:family/:year -- Update payment records
```

---

## Core Features

### Parent Functionality

**Task Submission:**
- Form with: hours (integer input for hours and buttons for 15 min increments), date, category, description
- Client-side validation for reasonable values
- Automatic family assignment and current year tagging

**Family Dashboard:**
- Progress bar: completed hours vs required hours
- List of all family tasks (from all family members)
- Remaining hours and potential penalty calculation
- Edit/delete permissions only for own tasks

**Task Management:**
- View chronological list of family's volunteer tasks
- Filter by family member, category, or date range
- Edit own tasks (not others' tasks)
- Delete own tasks with confirmation

### Admin Functionality

**Analytics Dashboard:**
- Weekly volunteer hours chart for current year
- Year selector for historical data
- School-wide statistics: total families, total hours, families behind
- Export capabilities for reporting

**Family Management:**
- Create new families with unique names
- View all families with current status
- Archive families (hide from active lists, preserve data)
- Assign/reassign users to families

**User Management:**
- View all system users with family associations
- Archive users (prevents login, preserves historical data)
- Resend invitations for users who haven't joined
- Transfer users between families if needed

**Invitation System:**
- Send invitations via email with secure tokens
- Specify family assignment and role (parent/admin)
- Track invitation status (pending, used, expired)
- Resend invitations for "I didn't get it" cases

**Financial Tracking:**
- Year-by-year balance calculations
- Track payments made toward volunteer hour shortfalls
- Generate financial reports for bookkeeping
- Set penalty rates per school year

**Year Management:**
- Create new school years with custom parameters
- Set required hours and penalty rates per year
- Rollover process: create family_year_status records for all active families
- Historical data preservation across years

---

## Business Logic

### Hour Calculations
```typescript
// Family progress calculation
const totalHours = sum(tasks.hours) // For family + current year
const requiredHours = currentSchoolYear.requiredHours
const hoursRemaining = Math.max(0, requiredHours - totalHours)
const penalty = hoursRemaining * currentSchoolYear.hourlyRate
```

### Year Rollover Process
1. Admin creates new school year
2. System marks old year as inactive
3. Creates family_year_status records for all active families
4. Resets total_hours to 0 for new year
5. Clears school year cache

### Permission Enforcement
- Parents: `WHERE family_id = user.family_id AND school_year_id = current_year.id`
- Task editing: `WHERE user_id = current_user.id`
- Admins: No family restrictions, can specify year parameters

---

## Implementation Plan

### Stage 1: Foundation (Week 1)
**Goal**: Basic project setup with authentication

**Tasks:**
1. Initialize Node.js project with TypeScript, NextJS, Drizzle
2. Set up SQLite database with Drizzle schema
3. Configure Clerk authentication
4. Create basic middleware stack (auth, user injection)
5. Implement Clerk webhook for user creation
6. Create initial database seeding script with:
   - Sample school year (2024-2025, 50 hours, $20/hour)
   - Basic task categories (Classroom Help, Event Setup, Fundraising)
   - Admin user

**Deliverables:**
- Working authentication flow
- Database with sample data
- Basic API structure with middleware

### Stage 2: School Year Management (Week 1-2)
**Goal**: Implement caching and year management

**Tasks:**
1. Implement school year caching strategy
2. Create middleware to inject current school year
3. Build admin routes for school year management
4. Implement year rollover functionality
5. Add task category management (CRUD operations)

**Deliverables:**
- Cached school year system
- Admin can create/manage school years
- Admin can manage task categories

### Stage 3: Invitation System (Week 2)
**Goal**: Secure user onboarding process

**Tasks:**
1. Create invitation model and routes
2. Implement token generation and validation
3. Build admin invitation management interface
4. Create public invitation acceptance flow
5. Update Clerk webhook to handle pre-assigned families
6. Add email placeholder system (console logs initially)

**Deliverables:**
- Complete invitation workflow
- Admin can invite users to specific families
- Users can accept invites and join assigned families

### Stage 4: Family & User Management (Week 2-3)
**Goal**: Core admin functionality for managing people

**Tasks:**
1. Create family CRUD operations
2. Implement user archiving system
3. Build admin interfaces for family/user management
4. Add family creation with automatic family_year_status records
5. Implement user-family assignment changes

**Deliverables:**
- Admin can create and manage families
- Admin can archive/restore users and families
- Proper data relationships maintained

### Stage 5: Task Management (Week 3-4)
**Goal**: Core parent functionality for logging volunteer hours

**Tasks:**
1. Build task submission form with validation
2. Implement family task listing with filters
3. Add task editing/deletion with permission checks
4. Create progress calculation logic
5. Build parent dashboard with family overview
6. Add task categories dropdown integration

**Deliverables:**
- Parents can submit, view, edit, and delete tasks
- Family progress tracking works correctly
- Permission system enforces family boundaries

### Stage 6: Admin Analytics (Week 4-5)
**Goal**: Data visualization and reporting for admins

**Tasks:**
1. Build weekly hours aggregation queries
2. Create admin dashboard with charts
3. Implement year navigation for historical data
4. Add family status overview (who's behind, etc.)
5. Create exportable reports
6. Build system-wide statistics

**Deliverables:**
- Admin dashboard with visual analytics
- Historical data browsing
- Family performance overview

### Stage 7: Financial Tracking (Week 5)
**Goal**: Money management and penalty calculations

**Tasks:**
1. Implement balance calculation logic
2. Create financial tracking tables and queries
3. Build admin financial dashboard
4. Add payment recording functionality
5. Generate financial reports
6. Handle edge cases (negative balances, overpayment)

**Deliverables:**
- Complete financial tracking system
- Admin can record payments
- Automatic penalty calculations

### Stage 8: Polish & Production Prep (Week 6)
**Goal**: Production-ready application

**Tasks:**
1. Add comprehensive error handling
2. Implement proper logging system
3. Add data validation throughout
4. Create database migration system
5. Add email integration (replace console logs)
6. Security audit and testing
7. Performance optimization
8. Documentation and deployment guide

**Deliverables:**
- Production-ready codebase
- Email notifications working
- Comprehensive error handling
- Deployment documentation

---

## Technical Considerations

### Data Integrity
- Use database transactions for multi-table operations
- Implement cascading rules for archiving
- Validate hours in 0.25 increments
- Prevent task editing across school years

### Performance
- Index on frequently queried fields (family_id, school_year_id, is_active)
- Cache school year data at application level
- Use proper SQL aggregations for statistics
- Limit query results with pagination where needed

### Security
- Validate all user inputs
- Enforce family-scoped access for parents
- Use secure random tokens for invitations
- Sanitize data before database storage
- Rate limit invitation sending

### Error Handling
- Graceful handling of Clerk webhook failures
- Transaction rollback on multi-step operation failures
- Clear error messages for validation failures
- Logging for debugging and monitoring

---

## Future Enhancements

**Phase 2 Features:**
- Email notifications for approaching deadlines
- Bulk task import via CSV
- Mobile-responsive design improvements
- Task approval workflow (admin review)
- Integration with school calendar systems
- Automated reminder system

**Administrative Features:**
- Audit log for admin actions
- Bulk user operations
- Advanced reporting and analytics
- Integration with payment processing
- Multi-school support

This PRD provides a comprehensive roadmap for building a robust volunteer hour management system suitable for elementary schools. The staged implementation approach allows for iterative development while maintaining a clear vision of the final product.