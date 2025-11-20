# Bank Slip Storage - Database Implementation

## Overview
Bank slips are now stored **directly in MongoDB** as binary data instead of being saved to the local filesystem.

## Changes Made

### 1. **TicketRegistration Model** (`models/TicketRegistration.js`)
- **Before**: Stored file path reference
  ```javascript
  bankSlip: {
    filename: String,
    path: String,  // File system path
    ...
  }
  ```
  
- **After**: Stores binary data
  ```javascript
  bankSlip: {
    data: Buffer,  // Binary file data stored in MongoDB
    originalName: String,
    mimetype: String,
    size: Number
  }
  ```

### 2. **File Upload Routes** (`routes/ticketRegistrations.js`)

#### Multer Configuration
- **Changed from**: `diskStorage` (saves to filesystem)
- **Changed to**: `memoryStorage` (keeps in memory for database)

#### POST /api/ticket-registrations
- Now stores `req.file.buffer` directly to database
- No filesystem operations needed
- Files stored as Buffer type in MongoDB

#### GET /api/ticket-registrations/:id/download-slip
- **Before**: Read from filesystem with `fs.createReadStream()`
- **After**: Retrieve from database and send binary data directly
  ```javascript
  res.send(registration.bankSlip.data);
  ```

#### DELETE /api/ticket-registrations/:id
- Removed filesystem cleanup code
- Files automatically deleted when document is removed

### 3. **Query Optimization**
All list/get endpoints now exclude binary data:
```javascript
.select('-bankSlip.data')  // Don't return binary data in lists
```

## Benefits

✅ **No filesystem management** - No need to maintain uploads directory  
✅ **Automatic cleanup** - Files deleted when registration is deleted  
✅ **Consistent backups** - Files backed up with database  
✅ **Simplified deployment** - No need to persist uploads folder  
✅ **Scalability** - Works better with cloud deployments  

## Considerations

⚠️ **Database size**: Files stored in MongoDB increase database size  
⚠️ **16MB limit**: MongoDB documents limited to 16MB (current 5MB file limit is safe)  
⚠️ **Performance**: Suitable for moderate file volumes (not millions of files)

## Testing

1. **Submit a registration** with bank slip via ticket form
2. **Verify storage**: Check MongoDB - bankSlip.data should contain Buffer
3. **Download file**: Admin dashboard download button should retrieve file
4. **Delete registration**: File should be removed with document

## File Size Limits

- **Current limit**: 5MB per file
- **MongoDB document limit**: 16MB
- **Recommended**: Keep files under 10MB

## Deployment Notes

- ✅ No need to configure file storage volumes
- ✅ No need to sync uploads between servers
- ✅ Database backups include all file data
- ❌ Old local files in `uploads/` folder can be safely deleted
