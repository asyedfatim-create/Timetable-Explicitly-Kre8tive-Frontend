# IBIT TAS — Backend API Documentation

> **Purpose**: This document lists every API endpoint the backend must provide to replace all hardcoded/in-memory data in the frontend.

---

## Base URL

```
https://your-domain.com/api/v1
```

All endpoints return JSON. Use `Authorization: Bearer <token>` header for protected routes.

---

## 1. Authentication

### `POST /auth/login`

**Request Body:**
```json
{
  "email": "admin@ibit.edu.pk",
  "password": "12345678",
  "role": "admin"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@ibit.edu.pk",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Role mismatch (403):**
```json
{
  "success": false,
  "message": "This account is a teacher, not an admin. Please select the correct role."
}
```

> **Note:** Frontend currently checks against `ROLE_CREDENTIALS` in `app-state.js`. Backend should validate credentials and return a JWT.

---

### `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

### `GET /auth/me`

Returns current user info from token. Used on page refresh to restore session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "name": "Admin",
  "email": "admin@ibit.edu.pk",
  "role": "admin"
}
```

---

## 2. Teachers CRUD

### `GET /teachers`

Fetch all teachers. Supports optional query params for filtering/sorting.

**Query Params (all optional):**
| Param    | Type   | Example           |
|----------|--------|-------------------|
| `search` | string | `sara`            |
| `status` | string | `Active`, `On Leave` |
| `dept`   | string | `CS`, `SE`, `IT`  |
| `sort`   | string | `name`, `load`    |
| `order`  | string | `asc`, `desc`     |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Dr. Sara Ahmed",
      "email": "sara@ibit.edu.pk",
      "dept": "CS",
      "status": "Active",
      "courses": ["IP", "MAD"],
      "load": 8
    }
  ],
  "meta": {
    "total": 6,
    "active": 5,
    "onLeave": 1,
    "avgLoad": 6
  }
}
```

---

### `GET /teachers/:id`

**Response (200):**
```json
{
  "id": 1,
  "name": "Dr. Sara Ahmed",
  "email": "sara@ibit.edu.pk",
  "dept": "CS",
  "status": "Active",
  "courses": ["IP", "MAD"],
  "load": 8
}
```

---

### `POST /teachers`

**Request Body:**
```json
{
  "name": "Dr. Sara Ahmed",
  "email": "sara@ibit.edu.pk",
  "dept": "CS",
  "status": "Active",
  "courses": ["IP", "MAD"],
  "load": 8
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Dr. Sara Ahmed added",
  "data": { "id": 7, "name": "Dr. Sara Ahmed", "..." : "..." }
}
```

---

### `PUT /teachers/:id`

**Request Body:** Same structure as POST (all fields).

**Response (200):**
```json
{
  "success": true,
  "message": "Dr. Sara Ahmed updated",
  "data": { "id": 1, "name": "Dr. Sara Ahmed", "..." : "..." }
}
```

---

### `DELETE /teachers/:id`

**Response (200):**
```json
{ "success": true, "message": "Dr. Sara Ahmed removed" }
```

---

## 3. Rooms CRUD

### `GET /rooms`

**Query Params (all optional):**
| Param    | Type   | Example                      |
|----------|--------|------------------------------|
| `search` | string | `lab`                        |
| `type`   | string | `Lab`, `Lecture`, `Auditorium` |
| `status` | string | `Available`, `Under Maintenance` |
| `sort`   | string | `name`, `capacity`, `util`   |
| `order`  | string | `asc`, `desc`                |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Lab 204",
      "type": "Lab",
      "capacity": 40,
      "floor": "2",
      "facilities": ["Computers", "Projector", "AC"],
      "utilization": 92,
      "status": "Available"
    }
  ],
  "meta": {
    "total": 7,
    "available": 6,
    "totalCapacity": 450,
    "avgUtilization": 67
  }
}
```

---

### `GET /rooms/:id`

**Response (200):**
```json
{
  "id": 1,
  "name": "Lab 204",
  "type": "Lab",
  "capacity": 40,
  "floor": "2",
  "facilities": ["Computers", "Projector", "AC"],
  "utilization": 92,
  "status": "Available"
}
```

---

### `POST /rooms`

**Request Body:**
```json
{
  "name": "Lab 204",
  "type": "Lab",
  "capacity": 40,
  "floor": "2",
  "facilities": ["Computers", "Projector", "AC"],
  "status": "Available"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Lab 204 added",
  "data": { "id": 8, "name": "Lab 204", "..." : "..." }
}
```

---

### `PUT /rooms/:id`

**Request Body:** Same structure as POST.

**Response (200):**
```json
{
  "success": true,
  "message": "Lab 204 updated",
  "data": { "id": 1, "..." : "..." }
}
```

---

### `DELETE /rooms/:id`

**Response (200):**
```json
{ "success": true, "message": "Lab 204 removed" }
```

---

## 4. Courses CRUD

### `GET /courses`

**Query Params (all optional):**
| Param    | Type   | Example                       |
|----------|--------|-------------------------------|
| `search` | string | `internet`                    |
| `type`   | string | `Core`, `Elective`, `Lab`     |
| `ch`     | int    | `3`, `1`                      |
| `sort`   | string | `name`, `code`, `ch`          |
| `order`  | string | `asc`, `desc`                 |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Internet Programming",
      "code": "IP",
      "type": "Core",
      "creditHours": 3,
      "teacherId": 1,
      "teacherName": "Dr. Sara Ahmed",
      "sessionsPerWeek": 3,
      "color": "gold"
    }
  ],
  "meta": {
    "total": 6,
    "core": 4,
    "elective": 1,
    "lab": 1
  }
}
```

---

### `GET /courses/:id`

Returns a single course object (same shape as array item above).

---

### `POST /courses`

**Request Body:**
```json
{
  "name": "Internet Programming",
  "code": "IP",
  "type": "Core",
  "creditHours": 3,
  "teacherId": 1,
  "sessionsPerWeek": 3,
  "color": "gold"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Internet Programming added",
  "data": { "id": 7, "..." : "..." }
}
```

---

### `PUT /courses/:id`

**Request Body:** Same structure as POST.

**Response (200):**
```json
{
  "success": true,
  "message": "Internet Programming updated",
  "data": { "id": 1, "..." : "..." }
}
```

---

### `DELETE /courses/:id`

**Response (200):**
```json
{ "success": true, "message": "Internet Programming removed" }
```

---

## 5. Sections CRUD

### `GET /sections`

**Query Params (all optional):**
| Param    | Type   | Example              |
|----------|--------|----------------------|
| `search` | string | `F23`                |
| `batch`  | string | `F23-Afternoon`      |
| `shift`  | string | `Morning`, `Afternoon` |
| `sort`   | string | `name`, `students`   |
| `order`  | string | `asc`, `desc`        |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "F23-Afternoon-A",
      "batch": "F23-Afternoon",
      "shift": "Afternoon",
      "label": "A",
      "students": 45,
      "capacity": 50,
      "courses": ["IP", "OS", "DS", "MAD", "DM"]
    }
  ],
  "meta": {
    "total": 4,
    "totalStudents": 168,
    "avgPerSection": 42,
    "nearFull": 1
  }
}
```

---

### `GET /sections/:id`

Returns a single section object.

---

### `POST /sections`

**Request Body:**
```json
{
  "name": "F23-Afternoon-A",
  "batch": "F23-Afternoon",
  "shift": "Afternoon",
  "label": "A",
  "students": 45,
  "capacity": 50,
  "courses": ["IP", "OS", "DS", "MAD", "DM"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "F23-Afternoon-A added",
  "data": { "id": 5, "..." : "..." }
}
```

---

### `PUT /sections/:id`

**Request Body:** Same as POST.

**Response (200):**
```json
{
  "success": true,
  "message": "F23-Afternoon-A updated",
  "data": { "id": 1, "..." : "..." }
}
```

---

### `DELETE /sections/:id`

**Response (200):**
```json
{ "success": true, "message": "F23-Afternoon-A removed" }
```

---

## 6. Timetable

### `GET /timetable`

Returns all timetable entries (draft or published). Filter by status.

**Query Params:**
| Param       | Type   | Example                     |
|-------------|--------|-----------------------------|
| `status`    | string | `draft`, `published`        |
| `sectionId` | int   | `1`                         |
| `batch`     | string | `F23-Afternoon`             |

**Response (200):**
```json
{
  "status": "draft",
  "entries": [
    {
      "id": 1,
      "dayIndex": 0,
      "slotIndex": 0,
      "sectionId": 1,
      "courseCode": "IP",
      "courseName": "Internet Programming",
      "color": "gold",
      "bg": "rgba(29,78,216,.12)",
      "border": "var(--gold-lt)",
      "fg": "var(--gold-lt)",
      "teacher": "Dr. Sara",
      "room": "Lab 204",
      "section": "F23-Afternoon-A"
    }
  ]
}
```

> The `dayIndex` is 0–4 (Mon–Fri), `slotIndex` is 0–6 (the 7 time slots).

---

### `POST /timetable/entry`

Add a single class to the timetable grid.

**Request Body:**
```json
{
  "dayIndex": 0,
  "slotIndex": 0,
  "sectionId": 1,
  "courseId": 1,
  "teacherId": 1,
  "roomId": 1
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "IP added — Monday · 8:00–9:00 AM",
  "entry": {
    "id": 1,
    "dayIndex": 0,
    "slotIndex": 0,
    "sectionId": 1,
    "courseCode": "IP",
    "teacher": "Dr. Sara",
    "room": "Lab 204",
    "section": "F23-Afternoon-A"
  }
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "message": "Dr. Sara already teaches at Monday · 8:00–9:00 AM",
  "conflictType": "teacher"
}
```

---

### `DELETE /timetable/entry/:id`

Remove a single class from the grid.

**Response (200):**
```json
{
  "success": true,
  "message": "Removed IP from Monday · 8:00–9:00 AM"
}
```

---

### `POST /timetable/publish`

Publish the current draft timetable.

**Request Body:**
```json
{
  "notify": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Timetable published successfully",
  "totalSlots": 30
}
```

**Error (if clashes exist) (409):**
```json
{
  "success": false,
  "message": "Fix 2 clashes before publishing",
  "clashCount": 2
}
```

---

### `POST /timetable/draft`

Save current state as draft.

**Response (200):**
```json
{
  "success": true,
  "message": "Draft saved — 30 slots"
}
```

---

### `DELETE /timetable/clear`

Clear all entries from the draft timetable.

**Response (200):**
```json
{ "success": true, "message": "Timetable cleared" }
```

---

### `GET /timetable/clashes`

Detect and return all scheduling conflicts.

**Response (200):**
```json
{
  "clashes": [
    {
      "id": 1,
      "type": "Teacher Double-Booking",
      "priority": "High",
      "teacher": "Dr. Sara",
      "day": "Monday",
      "dayIndex": 0,
      "time": "8:00–9:00 AM",
      "slotIndex": 0,
      "classA": "IP · F23-Afternoon-A",
      "classB": "MAD · F23-Afternoon-B",
      "sectionBId": 2
    },
    {
      "id": 2,
      "type": "Room Double-Booking",
      "priority": "Medium",
      "room": "Lab 204",
      "day": "Tuesday",
      "dayIndex": 1,
      "time": "9:00–10:00 AM",
      "slotIndex": 1,
      "classA": "OS · F23-Afternoon-A",
      "classB": "DS · F23-Morning-A",
      "sectionBId": 4
    }
  ],
  "totalClashes": 2
}
```

---

### `POST /timetable/clashes/:id/resolve`

Auto-resolve a clash by removing the conflicting class (Class B).

**Response (200):**
```json
{
  "success": true,
  "message": "Conflict resolved — removed DS from F23-Morning-A on Tuesday"
}
```

---

## 7. Notifications

### `GET /notifications`

**Query Params:**
| Param    | Type   | Example                        |
|----------|--------|--------------------------------|
| `filter` | string | `all`, `coral`, `teal`, `gold`, `amber` |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Lecture Cancelled — OS · Section B",
      "message": "Dr. Kamran cancelled today's Operating Systems lecture for Section B.",
      "type": "coral",
      "time": "2026-05-02T18:00:00Z",
      "unread": true
    }
  ],
  "meta": {
    "total": 6,
    "unread": 4,
    "cancels": 2,
    "makeup": 1,
    "changes": 2,
    "requests": 1
  }
}
```

---

### `PATCH /notifications/:id/read`

Mark a single notification as read.

**Response (200):**
```json
{ "success": true }
```

---

### `PATCH /notifications/read-all`

Mark all notifications as read.

**Response (200):**
```json
{ "success": true, "message": "All notifications marked as read" }
```

---

## 8. Requests (Teacher → Admin)

### `GET /requests`

**Query Params:**
| Param    | Type   | Example                    |
|----------|--------|----------------------------|
| `status` | string | `pending`, `approved`, `rejected` |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "type": "Makeup / Reschedule",
      "teacherId": 1,
      "teacherName": "Dr. Sara",
      "detail": "IP · F23-Afternoon-A · Makeup on 2026-04-21 · Room 202",
      "course": "IP",
      "section": "F23-Afternoon-A",
      "reason": "Sick leave",
      "status": "pending",
      "createdAt": "2026-05-01T10:00:00Z"
    }
  ],
  "pendingCount": 3
}
```

---

### `POST /requests`

Teacher submits a new request. Three types supported.

**Makeup/Reschedule:**
```json
{
  "type": "Makeup / Reschedule",
  "course": "IP",
  "section": "F23-Afternoon-A",
  "newDate": "2026-04-21",
  "room": "Room 202",
  "reason": "Make up for cancelled class"
}
```

**Section Merge:**
```json
{
  "type": "Section Merge",
  "course": "DS",
  "sectionA": "F23-Afternoon-A",
  "sectionB": "F23-Afternoon-B",
  "venue": "Auditorium"
}
```

**Cancel Lecture:**
```json
{
  "type": "Cancel Lecture",
  "course": "OS",
  "section": "F23-Afternoon-B",
  "date": "2026-04-18",
  "reason": "Sick Leave"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Request submitted! Admin will review shortly.",
  "data": { "id": 4, "status": "pending", "..." : "..." }
}
```

---

### `PATCH /requests/:id/approve`

Admin approves a request.

**Response (200):**
```json
{
  "success": true,
  "message": "Approved: Dr. Sara – Makeup / Reschedule"
}
```

---

### `PATCH /requests/:id/reject`

Admin rejects a request.

**Response (200):**
```json
{
  "success": true,
  "message": "Rejected: Dr. Sara – Makeup / Reschedule"
}
```

---

## 9. Dashboard Stats

### `GET /dashboard/stats`

Returns aggregated stats for the admin dashboard.

**Response (200):**
```json
{
  "teachers": { "total": 6, "active": 5, "onLeave": 1, "avgLoad": 6 },
  "rooms":    { "total": 7, "available": 6, "totalCapacity": 450, "avgUtilization": 67 },
  "courses":  { "total": 6, "core": 4, "elective": 1, "lab": 1 },
  "sections": { "total": 4, "totalStudents": 168, "avgPerSection": 42, "nearFull": 1 },
  "timetable": { "totalSlots": 30, "clashCount": 0, "status": "published" },
  "pendingRequests": 3
}
```

---

## 10. Constants / Lookup

### `GET /constants`

Returns static lookup data used across the UI (days, time slots, departments, etc).

**Response (200):**
```json
{
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "slots": ["8:00–9:00 AM", "9:00–10:00 AM", "10:00–11:00 AM", "11:00 AM–12:00 PM", "1:00–2:00 PM", "2:00–3:00 PM", "3:00–4:00 PM"],
  "slotLabels": ["8:00 – 9:00 AM", "9:00 – 10:00 AM", "10:00 – 11:00 AM", "11:00 – 12:00 PM", "1:00 – 2:00 PM", "2:00 – 3:00 PM", "3:00 – 4:00 PM"],
  "departments": ["CS", "SE", "IT"],
  "roomTypes": ["Lab", "Lecture", "Auditorium"],
  "courseTypes": ["Core", "Elective", "Lab"],
  "courseColors": ["gold", "teal", "amber", "coral", "blue", "purple"],
  "shifts": ["Morning", "Afternoon"],
  "teacherStatuses": ["Active", "On Leave", "Inactive"],
  "roomStatuses": ["Available", "Under Maintenance"],
  "facilities": ["Computers", "Projector", "AC", "Whiteboard"]
}
```

---

## API Summary Table

| #  | Method   | Endpoint                          | Auth   | Role         |
|----|----------|-----------------------------------|--------|--------------|
| 1  | `POST`   | `/auth/login`                     | ❌     | Public       |
| 2  | `POST`   | `/auth/logout`                    | ✅     | All          |
| 3  | `GET`    | `/auth/me`                        | ✅     | All          |
| 4  | `GET`    | `/teachers`                       | ✅     | Admin        |
| 5  | `GET`    | `/teachers/:id`                   | ✅     | Admin        |
| 6  | `POST`   | `/teachers`                       | ✅     | Admin        |
| 7  | `PUT`    | `/teachers/:id`                   | ✅     | Admin        |
| 8  | `DELETE` | `/teachers/:id`                   | ✅     | Admin        |
| 9  | `GET`    | `/rooms`                          | ✅     | Admin        |
| 10 | `GET`    | `/rooms/:id`                      | ✅     | Admin        |
| 11 | `POST`   | `/rooms`                          | ✅     | Admin        |
| 12 | `PUT`    | `/rooms/:id`                      | ✅     | Admin        |
| 13 | `DELETE` | `/rooms/:id`                      | ✅     | Admin        |
| 14 | `GET`    | `/courses`                        | ✅     | Admin        |
| 15 | `GET`    | `/courses/:id`                    | ✅     | Admin        |
| 16 | `POST`   | `/courses`                        | ✅     | Admin        |
| 17 | `PUT`    | `/courses/:id`                    | ✅     | Admin        |
| 18 | `DELETE` | `/courses/:id`                    | ✅     | Admin        |
| 19 | `GET`    | `/sections`                       | ✅     | Admin        |
| 20 | `GET`    | `/sections/:id`                   | ✅     | Admin        |
| 21 | `POST`   | `/sections`                       | ✅     | Admin        |
| 22 | `PUT`    | `/sections/:id`                   | ✅     | Admin        |
| 23 | `DELETE` | `/sections/:id`                   | ✅     | Admin        |
| 24 | `GET`    | `/timetable`                      | ✅     | All          |
| 25 | `POST`   | `/timetable/entry`                | ✅     | Admin        |
| 26 | `DELETE` | `/timetable/entry/:id`            | ✅     | Admin        |
| 27 | `POST`   | `/timetable/publish`              | ✅     | Admin        |
| 28 | `POST`   | `/timetable/draft`                | ✅     | Admin        |
| 29 | `DELETE` | `/timetable/clear`                | ✅     | Admin        |
| 30 | `GET`    | `/timetable/clashes`              | ✅     | Admin        |
| 31 | `POST`   | `/timetable/clashes/:id/resolve`  | ✅     | Admin        |
| 32 | `GET`    | `/notifications`                  | ✅     | All          |
| 33 | `PATCH`  | `/notifications/:id/read`         | ✅     | All          |
| 34 | `PATCH`  | `/notifications/read-all`         | ✅     | All          |
| 35 | `GET`    | `/requests`                       | ✅     | Admin, Teacher |
| 36 | `POST`   | `/requests`                       | ✅     | Teacher      |
| 37 | `PATCH`  | `/requests/:id/approve`           | ✅     | Admin        |
| 38 | `PATCH`  | `/requests/:id/reject`            | ✅     | Admin        |
| 39 | `GET`    | `/dashboard/stats`                | ✅     | Admin        |
| 40 | `GET`    | `/constants`                      | ❌     | Public       |

**Total: 40 endpoints**

---

## Suggested Database Tables

| Table            | Key Columns |
|------------------|-------------|
| `users`          | id, name, email, password_hash, role, status |
| `teachers`       | id, user_id (FK), dept, load |
| `rooms`          | id, name, type, capacity, floor, facilities (JSON), utilization, status |
| `courses`        | id, name, code, type, credit_hours, teacher_id (FK), sessions_per_week, color |
| `sections`       | id, name, batch, shift, label, students, capacity |
| `section_courses`| section_id, course_id (many-to-many) |
| `teacher_courses`| teacher_id, course_id (many-to-many) |
| `timetable_entries` | id, day_index, slot_index, section_id, course_id, teacher_id, room_id, status (draft/published) |
| `notifications`  | id, user_id, title, message, type, is_read, created_at |
| `requests`       | id, teacher_id, type, detail (JSON), status, created_at, resolved_at, resolved_by |

---

## Error Response Format (Global)

All errors follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

| HTTP Code | Meaning              |
|-----------|----------------------|
| `400`     | Validation error     |
| `401`     | Unauthorized (no/bad token) |
| `403`     | Forbidden (wrong role) |
| `404`     | Resource not found   |
| `409`     | Conflict (clash, duplicate) |
| `500`     | Server error         |
