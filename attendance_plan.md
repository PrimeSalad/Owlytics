# Attendance Management Plan

## Overview
Implement a section-based attendance management system where attendance committee members are assigned to specific sections and can only manage attendance for their assigned section(s).

## Core Requirements

### 1. Section Assignment for Attendance Role
- Attendance committee members must have a section assigned at account creation time
- Section assignment is mandatory (cannot be left blank)
- Section assignment determines which students' attendance they can view/manage
- Attendance staff can only see and modify attendance records for their assigned section

### 2. Account Creation for Attendance Committee
- When creating a new attendance committee account:
  - **Section Selection**: Dropdown field (mandatory)
    - Display available sections with format: `[Course] - Year [Year] - Block [Block]`
    - Example: `BS Computer Science - Year 2 - Block A`
  - **Access Level**: Staff role with attendance privileges
  - **Validation**: Section must be selected before account creation completes

### 3. UI Components

#### Section Dropdown Specifications
- **Label**: "Assigned Section"
- **Type**: Dropdown/Select field
- **Options Structure**:
  - Group by Course
  - Filter by Academic Year (e.g., Year 1, 2, 3, 4)
  - Filter by Block (A, B, C, etc.)
- **Format Example**:
  ```
  BS Computer Science - Year 2 - Block A
  BS Computer Science - Year 2 - Block B
  BS Information Technology - Year 1 - Block A
  ```
- **Required**: Yes (cannot submit form without selection)
- **Searchable**: Yes (allow filtering in dropdown)

### 4. Attendance Role Permissions
- View attendance records only for assigned section
- Add/Edit/Delete attendance entries for assigned section
- Cannot access sections not assigned to them
- Admin can override and manage all sections

### 5. Data Model Updates

#### Attendance Committee Table
```
id: Primary Key
user_id: Foreign Key to Users
section_id: Foreign Key to Sections (NOT NULL)
assigned_date: Timestamp
assigned_by: Admin User ID
status: active/inactive
```

#### Sections Table (if not existing)
```
id: Primary Key
course_id: Foreign Key to Courses
academic_year: Integer (1, 2, 3, 4)
block: String (A, B, C, etc.)
total_students: Integer
created_date: Timestamp
```

### 6. Implementation Steps

1. **Database Schema**
   - Ensure Sections table exists with proper structure
   - Add section_id to attendance committee members table
   - Create indexes on section_id for performance

2. **Backend API**
   - GET /api/sections - Fetch available sections for dropdown
   - POST /api/attendance-committee - Create new attendance staff with section
   - PUT /api/attendance-committee/:id - Update section assignment
   - GET /api/attendance/students?section_id=X - Get students by section
   - Middleware: Verify attendance staff can only access their assigned section

3. **Frontend Components**
   - Section selector dropdown component
   - Integration in account creation form
   - Display assigned section in staff profile
   - Attendance dashboard filtered by assigned section

4. **Access Control**
   - Implement middleware to check section authorization
   - Validate all attendance queries against assigned section
   - Prevent unauthorized section access

### 7. Validation Rules

- Section must exist in database
- Section must have active status
- Academic year must be valid (1-4)
- Block must be in valid list (A, B, C, D, etc.)
- Attendance staff cannot self-assign different sections
- Only admin can change section assignments

### 8. Error Handling

- "Section not found" - when selected section doesn't exist
- "No section assigned" - when staff tries to view attendance without section
- "Unauthorized section access" - when staff tries to access other sections
- "Section is inactive" - when assigned section is no longer available

## UI Flow for Account Creation

```
1. Fill basic info (name, email, password)
2. Select Role: "Attendance Committee"
3. NEW STEP - Select Assigned Section (dropdown)
   - Shows: [Course] - Year [Year] - Block [Block]
   - Filterable/searchable
   - Required field - cannot proceed without selection
4. Review and confirm
5. Account created with section restriction
```

## Testing Checklist

- [ ] Dropdown loads all available sections correctly
- [ ] Section filter works (by course, year, block)
- [ ] Cannot create account without section selected
- [ ] Attendance staff can only see their assigned section
- [ ] Attendance staff cannot access other sections via direct API calls
- [ ] Admin can view all sections and override permissions
- [ ] Section assignment is persistent after account creation
- [ ] Edit section assignment works for admin only
- [ ] Multiple staff can be assigned to same section
- [ ] Attendance records are properly filtered by section

## Future Enhancements

- Multi-section assignment for senior attendance staff
- Temporary section assignment with expiry dates
- Attendance report generation per section
- Bulk attendance operations within section
- Section-wise attendance analytics
