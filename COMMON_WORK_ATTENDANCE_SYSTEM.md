# Common Work Attendance System

## Overview
This system allows tracking attendance for common work activities within the Eksath organization. It provides functionality similar to the funeral attendance system but specifically designed for community work activities.

## Backend Implementation

### 1. Database Model (`CommonWork.js`)
```javascript
{
  date: Date,                    // Date of the work activity
  title: String,                 // Title of the work (required)
  description: String,           // Detailed description
  workType: Enum,               // Type: maintenance, construction, cleaning, landscaping, repair, other
  location: String,             // Location of the work
  absents: [Number],            // Array of absent member IDs
  organizer: String,            // Person organizing the work
  remarks: String,              // Special notes
  totalExpectedMembers: Number, // Total members expected to attend
  totalPresentMembers: Number,  // Total members who actually attended
  timestamps: true              // createdAt, updatedAt
}
```

### 2. Controller Functions (`commonWorkController.js`)
- `getCommonWorkById()` - Get specific work by ID
- `getCommonWorkByDate()` - Get work by date (for editing)
- `getAllCommonWorks()` - Get all works with pagination and filtering
- `saveCommonWorkAttendance()` - Create or update work attendance
- `deleteCommonWork()` - Delete a work record
- `getCommonWorkStats()` - Get statistics for analysis

### 3. API Routes (`/commonwork`)
- `GET /` - List all common works (paginated, filtered)
- `GET /stats` - Get work statistics
- `GET /date?date=YYYY-MM-DD` - Get work by specific date
- `GET /:workId` - Get specific work details
- `POST /attendance` - Save/update work attendance
- `DELETE /:workId` - Delete work record

### 4. Member Filtering
Uses existing `getMembersForCommonWorkDocument()` endpoint which:
- Excludes free members
- Excludes deactivated and deceased members
- Includes all active members regardless of roles

## Frontend Implementation

### 1. Main Attendance Page (`/commonworks/attendance`)
**Features:**
- Date selection with auto-loading of existing work
- Work details form (title, type, description, location, organizer, remarks)
- Visual attendance chart similar to funeral attendance
- Real-time validation and feedback
- Update existing records or create new ones

**Form Fields:**
- Title* (required)
- Work Type* (required) - dropdown with predefined options
- Description (optional)
- Location (optional)
- Organizer (optional)
- Remarks (optional)

### 2. Index/List Page (`/commonworks/`)
**Features:**
- Paginated list of all common work activities
- Filtering by work type and year
- Statistics dashboard showing attendance rates
- Edit and delete functionality
- Attendance rate visualization with color coding

### 3. Common Work Attendance Chart (`CommonWorkAttChart.js`)
**Features:**
- Grid-based member selection (similar to funeral chart)
- Color-coded attendance status
- Bulk select/deselect options
- Real-time attendance calculation
- Optimized for large member lists (100 members per group)

## Key Features

### 1. Work Types
- **නඩත්තු කටයුතු** (Maintenance)
- **ඉදිකිරීම් කටයුතු** (Construction)
- **පිරිසිදු කිරීම** (Cleaning)
- **භූමි අලංකරණය** (Landscaping)
- **අලුත්වැඩියා කටයුතු** (Repair)
- **වෙනත්** (Other)

### 2. Smart Date Handling
- Automatic loading of existing work when date is selected
- Prevents duplicate work records for the same date
- Updates existing records instead of creating duplicates
- Date range queries for efficient data retrieval

### 3. Statistics and Analytics
- Total works per year/type
- Average attendance rates
- Expected vs actual attendance
- Work type distribution
- Attendance trend analysis

### 4. Member Management
- Excludes inappropriate members (free status, deactivated, deceased)
- Includes all eligible active members
- Real-time attendance calculation
- Visual feedback for attendance status

## Data Flow

### Creating New Work:
1. User selects date and fills work details
2. System checks for existing work on that date
3. User marks attendance on the chart
4. System saves work details and attendance
5. Statistics are automatically calculated

### Updating Existing Work:
1. User selects date with existing work
2. System loads existing work details and attendance
3. User modifies details and/or attendance
4. System updates the record
5. Statistics are recalculated

## Security and Access Control

### Role-Based Access:
- **Vice-Secretary**: Full access (create, edit, delete)
- **Treasurer**: View access for financial reporting
- **Auditor**: View access for auditing purposes

### Data Validation:
- Required field validation (title, work type)
- Date format validation
- Member ID validation
- Duplicate prevention

## Benefits

1. **Comprehensive Tracking**: Track all types of community work activities
2. **Historical Records**: Maintain complete attendance history
3. **Performance Analytics**: Monitor community participation trends
4. **Accountability**: Clear record of who participated in what activities
5. **Planning Tool**: Use historical data for future planning
6. **Integration**: Seamlessly integrates with existing member management

## Usage Examples

### Scenario 1: Monthly Temple Cleaning
- Date: 2025-01-15
- Title: "විහාරස්ථානය පිරිසිදු කිරීම"
- Type: Cleaning
- Location: "විහාරස්ථානය"
- Organizer: "සභාපති"

### Scenario 2: Community Hall Construction
- Date: 2025-02-10
- Title: "සාමූහික ශාලාව ඉදිකිරීම"
- Type: Construction
- Location: "ප්‍රධාන මාර්ගය"
- Description: "මූලික ගොඩනැගිලි කාර්ය"

### Scenario 3: Road Maintenance
- Date: 2025-03-05
- Title: "ප්‍රධාන මාර්ගය අලුත්වැඩියා"
- Type: Maintenance
- Location: "ප්‍රධාන මාර්ගය"
- Remarks: "වර්ෂාව නිසා හානි"

## Technical Considerations

### Performance:
- Pagination for large datasets
- Efficient date range queries
- Optimized member loading
- Minimal API calls

### Scalability:
- Flexible work type system
- Expandable filtering options
- Modular component design
- Database indexing on frequently queried fields

### Maintainability:
- Clear separation of concerns
- Reusable components
- Consistent error handling
- Comprehensive logging

This implementation provides a robust, user-friendly system for tracking community work attendance while maintaining consistency with the existing application architecture and design patterns.
