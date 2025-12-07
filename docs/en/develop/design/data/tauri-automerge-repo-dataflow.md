# Automerge-Repo Concept Design Document

Task management application data management system concept design.
Provides clean architecture and Automerge-Repo CRDT operations through a 4-layer call structure: Tauri → Commands → Facade → Service → Repository.

## Design Overview

### Architecture

```
Frontend (SvelteKit)
    ↓ Tauri Invoke
Commands Layer (Tauri Command)
    ↓ Facade calls
Facade Layer (Application Facade)
    ↓ Business logic calls
Service Layer (Business Logic)
    ↓ Data access
Repository Layer (Data Access Layer)
    ├── local_automerge/ (Automerge implementation)
    ├── local_sqlite/ (SQLite implementation)
    ├── cloud_automerge/ (Cloud storage Automerge implementation)
    └── web/ (Web server implementation)
```

### Layer Responsibilities

- **Commands Layer**:
  - Tauri invoke function exposure
  - Input validation, result conversion
  - Facade layer calls

- **Facade Layer**:
  - Application layer integration point
  - Multi-service coordination processing
  - Transaction boundary management
  - Command model conversion

- **Service Layer**:
  - Domain business logic
  - Inter-entity consistency maintenance
  - Permission and validation checks
  - Storage implementation-independent abstraction

- **Repository Layer**:
  - Data access concrete implementation
  - Multiple storage type implementations
    - **local_automerge/**: Local Automerge implementation
    - **local_sqlite/**: Local SQLite implementation
    - **cloud_automerge/**: Cloud Automerge implementation
    - **web/**: Web server implementation
  - CRUD operations and data persistence
  - Type conversion and serialization

### Data Flow

```
Frontend Request → Commands Layer → Facade Layer → Service Layer → Repository Layer
                                                                        ↓
                                                    Repository implementation branching
                                                    ├── local_automerge/
                                                    ├── local_sqlite/
                                                    ├── cloud_automerge/
                                                    └── web/
                                                                        ↓
                                                    Selected storage data operations
                                                                        ↓
                                                    Network Sync (as needed)
```

### Automerge Document Operation Flow

Basic operation patterns within Repository Layer:

1. Document retrieval → 2. Type conversion → 3. Struct operations → 4. Document update → 5. Save and sync

CRDT operation types:

- Insert: Add new entities
- Update: Partial update of existing data
- Delete: Move documents to `.deleted/` folder (see "Document Deletion and Trash Feature" below)

For detailed implementation examples, refer to the separate document "automerge-document-operations.md".

## Project Structure

```
src-tauri/src/
├── commands/                   # Tauri command layer
│   └── mod.rs                  # Tauri invoke function exposure
├── facades/                    # Application facade layer
│   └── mod.rs                  # Multi-service coordination processing
├── services/                   # Domain business logic layer
│   └── mod.rs                  # Storage-independent business logic
├── repositories/               # Data access layer (multiple implementations)
│   ├── local_automerge/        # Local Automerge implementation
│   │   ├── document_manager.rs
│   │   ├── project.rs
│   │   ├── account.rs
│   │   ├── user.rs
│   │   └── settings.rs
│   ├── local_sqlite/           # Local SQLite implementation
│   │   └── mod.rs
│   ├── cloud_automerge/        # Cloud Automerge implementation
│   │   └── mod.rs
│   ├── web/                    # Web server implementation
│   │   └── mod.rs
│   ├── base_repository_trait.rs     # Base repository trait
│   ├── project_repository_trait.rs  # Project repository trait
│   ├── task_list_repository_trait.rs # Task list repository trait
│   └── mod.rs
├── models/                     # Data model layer
│   ├── project.rs
│   ├── account.rs
│   ├── user.rs
│   ├── task.rs
│   ├── task_list.rs
│   ├── tag.rs
│   ├── command/                # Command model (frontend⇔backend)
│   └── mod.rs
├── types/                      # Type definitions and enums
│   └── mod.rs
├── errors/                     # Error type definitions
│   └── mod.rs
└── main.rs
```

## Data Hierarchy Structure

### Automerge Document Segmentation

Current implementation divides into the following 4 Automerge documents:

```
settings.automerge                 # Settings and project list document
├── projects[] (Project struct array)
├── local_settings (LocalSettings struct)
└── view_settings[] (ViewItem struct array)

account.automerge                  # Account information document
└── (Account struct)

user.automerge                     # User information document
└── (User struct)

project_{project_id}.automerge     # Project-specific document
├── project_id (string)
├── task_lists[] (TaskList struct array)
├── tasks[] (Task struct array)
├── subtasks[] (SubTask struct array)
├── tags[] (Tag struct array)
└── project_members[] (ProjectMember struct array)
```

## Hierarchical Data Access API Design

### Basic Patterns

```rust
// Settings Document Access
list_projects() -> Result<Vec<Project>, RepositoryError>
get_local_settings() -> Result<LocalSettings, RepositoryError>
set_local_settings(settings: &LocalSettings) -> Result<(), RepositoryError>

// Account/User Document Access
get_account() -> Result<Option<Account>, RepositoryError>
set_account(account: &Account) -> Result<(), RepositoryError>
get_user() -> Result<Option<User>, RepositoryError>
set_user(user: &User) -> Result<(), RepositoryError>

// Project Document Access (per project_id)
// Task list operations
set_task_list(project_id: &str, task_list: &TaskList) -> Result<(), RepositoryError>
get_task_list(project_id: &str, task_list_id: &str) -> Result<Option<TaskList>, RepositoryError>
list_task_lists(project_id: &str) -> Result<Vec<TaskList>, RepositoryError>

// Task operations
set_task(project_id: &str, task: &Task) -> Result<(), RepositoryError>
get_task(project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError>
list_tasks(project_id: &str) -> Result<Vec<Task>, RepositoryError>

// Subtask operations
set_subtask(subtask: &SubTask) -> Result<(), RepositoryError>
get_subtask(subtask_id: &str) -> Result<Option<SubTask>, RepositoryError>
list_subtasks(task_id: &str) -> Result<Vec<SubTask>, RepositoryError>

// Tag operations
set_tag(project_id: &str, tag: &Tag) -> Result<(), RepositoryError>
get_tag(project_id: &str, tag_id: &str) -> Result<Option<Tag>, RepositoryError>
list_tags(project_id: &str) -> Result<Vec<Tag>, RepositoryError>

// Project member operations
set_project_member(project_id: &str, member: &ProjectMember) -> Result<(), RepositoryError>
get_project_member(project_id: &str, user_id: &str) -> Result<Option<ProjectMember>, RepositoryError>
list_project_members(project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError>
```

## Error Handling

### Error Conversion Flow

```
Repository Error → Service Error → Facade Error → Command Error → Frontend
```

### Layer Roles

- **RepositoryError**: Data access errors (storage-specific)
- **ServiceError**: Domain business logic errors (including automatic conversion from RepositoryError)
- **FacadeError**: Application integration errors (errors during multi-service coordination)
- **CommandError**: UI display errors (SerializationError, input validation errors, etc.)

### Data Consistency Errors

**Operations on Deleted Entities**:

- Operations on entities moved to `.deleted/` folder fail
- Return as RepositoryError
- Deleted documents are automatically excluded during FileStorage initialization

**Validation Errors**:

- Missing required fields, type constraint violations, etc.
- Input validation in Service Layer, data constraints in Repository Layer

**Error Notification**:

- All errors are notified to frontend as Command return values
- Frontend implements user display

### Sync Errors

**Retry Strategy**:

- Periodic sync: Retry on next sync
- Manual sync: User re-executes

**Offline Support**:

- Local operation is basic, sync is optional functionality
- Normal operation continues even when network is disconnected

## Key Features

### Automerge-Repo Integration

- CRDT operations for automatic merging
- Conflict resolution automation
- History management functionality

### Sync Functionality

- Local-first design (SQLite-based)
- Incremental sync: Automerge handles automatically
- Conflict detection: Automatic resolution during sync execution
- Sync targets: Web backend server (※self-hosting possible), cloud storage
- Offline operation: Standard functionality

### Data Management

- Type-safe struct operations
- Hierarchical data access
- Transaction management

### Type Safety

- Type guarantees through Rust strict type system
- Required fields: id, creation time, update time
- Other fields: All Optional (considering future extensibility)
- Type conversion failure: Process as invalid document error

## File Storage and Document ID Mapping

### File Storage Architecture

The Automerge file storage implementation uses **human-readable filenames** while maintaining compatibility with automerge-repo's DocumentId-based system through **in-memory mapping**.

### File Naming Conventions

Files are stored with descriptive names in `~/.local/share/flequit/automerge/`:

- `settings.automerge` - Application settings and project list
- `account.automerge` - Account information
- `user.automerge` - User profile
- `project_{uuid}.automerge` - Project-specific documents (one per project)

### Dynamic Mapping System

**No persistent mapping files are used.** Instead, the system builds an in-memory bidirectional mapping at startup:

1. **Startup Scan**: `FileStorage::new()` scans all `.automerge` files in the storage directory
   - Files in `.deleted/` folder are excluded (deleted files)
   - Directories are skipped (only files are processed)
2. **DocumentId Extraction**: Reads each file and extracts the embedded DocumentId from the binary Automerge data
3. **DocumentId Generation**: If DocumentId cannot be extracted from file content, it is deterministically generated from the filename (using UUID v5)
4. **Mapping Construction**: Builds `HashMap<DocumentId, Filename>` and `HashMap<Filename, DocumentId>` in memory
5. **Runtime Access**: All file operations use the in-memory mapping to translate between DocumentIds and filenames

### File Portability Benefits

This design enables:

- **Easy File Sharing**: Users can copy `.automerge` files directly to share data
- **Cloud Storage Compatibility**: Symbolic links to cloud storage folders work seamlessly
- **Zero Configuration**: Copied files work immediately without setup
- **Clean Storage**: Only `.automerge` files exist in the storage directory (no metadata files)

### Implementation Details

```rust
// In-memory only mapping (not persisted)
struct FileNameMapping {
    id_to_filename: HashMap<String, String>,
    filename_to_id: HashMap<String, String>,
}

// Startup initialization
pub fn new<P: AsRef<Path>>(base_path: P) -> Result<Self, AutomergeError> {
    // Scan existing .automerge files
    // Extract DocumentId from each file's binary content
    // Build in-memory mapping
}
```

### DocumentId Extraction and Generation

**Extraction**: DocumentIds are embedded in the automerge-repo binary file format. The `extract_document_id_from_file()` method parses the binary structure to retrieve the UUID that identifies each document within the automerge-repo system.

**Generation**: If the DocumentId cannot be extracted from file content (e.g., compacted files), the `generate_document_id_from_filename()` method deterministically generates the DocumentId from the filename using UUID v5 (name-based UUID). This ensures that the same filename always generates the same DocumentId, maintaining consistency regardless of file content.

### File Write Mapping Retention

During `append()` and `compact()` operations, the `ensure_mapping_from_path()` method is automatically called to extract the filename from the file path and ensure the mapping. This maintains the mapping even when file contents change.

## Document Deletion and Trash Feature

### Deletion Strategy

Automerge document deletion is implemented by **moving to the `.deleted/` folder** rather than physical deletion. This provides the following benefits:

- **Protection from Accidental Deletion**: Files are not completely deleted and can be restored
- **Data Backup**: Deleted files are included in backups
- **Audit Trail**: Records deletion datetime and original location

### File Structure

```
~/.local/share/flequit/automerge/
├── settings.automerge          # Active files
├── account.automerge           # Active files
├── user.automerge              # Active files
├── project_xxx.automerge       # Active files
└── .deleted/                   # Deleted folder
    ├── project_yyy.automerge       # Deleted project
    ├── project_yyy.meta.json       # Deletion metadata
    ├── project_zzz.automerge       # Deleted project
    └── project_zzz.meta.json       # Deletion metadata
```

### Deletion Metadata

A `.meta.json` file is automatically generated for each deleted file:

```json
{
  "doc_type": "Project(ProjectId(16e13612-6223-429b-b97f-45a6bfdf0b76))",
  "deleted_at": "2025-12-07T20:09:16.903708468Z",
  "original_filename": "project_16e13612-6223-429b-b97f-45a6bfdf0b76.automerge",
  "original_path": ".../automerge_data/project_16e13612-6223-429b-b97f-45a6bfdf0b76.automerge"
}
```

### Deletion Process Flow

1. **Remove from Memory Cache**: `DocumentManager::delete()` removes the document from memory
2. **File Check**: Verify original file exists
3. **Create `.deleted/` Folder**: Create if it doesn't exist
4. **Move File**: Move the original file to `.deleted/` folder
5. **Create Metadata**: Create a `.meta.json` file recording deletion datetime and original path
6. **Log Recording**: Record the deletion operation in logs

### FileStorage Initialization Exclusions

During `FileStorage::new()` startup scan, the following are automatically excluded:

- All files within `.deleted/` folder
- Directories (only files are processed)
- `.meta.json` files (metadata)

This ensures deleted documents are never loaded by the application.

### Future Extension Features

The following features can be implemented in the future:

#### Restore Function
```rust
/// Restore file from .deleted/ folder to original location
pub fn restore(&mut self, filename: &str) -> Result<(), AutomergeError>
```

- Get original path from metadata file
- Move file to original location
- Delete metadata file
- Update memory cache

#### Permanent Deletion Function (Platform-specific)

**Desktop Environments (Windows/macOS/Linux)**:
```rust
/// Move file from .deleted/ folder to OS trash
/// Uses trash crate
pub fn permanent_delete(&mut self, filename: &str) -> Result<(), AutomergeError>
```

**Mobile Environments (iOS/Android)**:
```rust
/// Permanently delete from .deleted/ folder
pub fn permanent_delete_mobile(&mut self, filename: &str) -> Result<(), AutomergeError>
```

#### Auto-Cleanup Function
```rust
/// Automatically delete files that have been deleted for specified number of days
pub fn cleanup_old_deleted_files(&mut self, days: u32) -> Result<(), AutomergeError>
```

- Check `deleted_at` in metadata
- Move files older than specified days to OS trash (desktop) or permanently delete (mobile)

### Design Benefits

✅ **Two-Stage Safety Net**: App restore → OS trash → Permanent deletion
✅ **Cross-Platform**: Unified operation across desktop and mobile
✅ **Easy Backup**: Complete migration including deleted files by copying folder
✅ **Simple Implementation**: Achieved with file moves only
✅ **Extensibility**: Restore, permanent delete, and auto-cleanup can be added incrementally

## Performance Optimization

### 2-Layer Storage Architecture

- **SQLite**: High-speed access to latest data, index and query optimization
- **Automerge**: Specialized for history management and sync functionality
- **Memory Efficiency**: Expand only necessary latest data in memory
- **Scalability**: Maintain runtime performance even when data volume increases

### Data Access Patterns

- **Read**: Get latest data from SQLite (high speed)
- **Write**: Update both SQLite and Automerge (consistency guarantee)
- **Sync**: Reflect changes from Automerge to SQLite
- **History**: Access past data from Automerge

### Automerge Document Granularity

- **4-Document Segmentation Method**:
  - **Settings Document**: Application settings and project list
  - **Account Document**: Authentication account information (provider information, authentication state)
  - **User Document**: User profile information (personal settings, profile)
  - **Project Documents**: Detailed data per project (1 project = 1 document)

- **Project Document Content**:
  - Project detailed data
  - All task lists, all tasks, all subtasks
  - Project-specific tags, member information

- **Design Rationale**:
  - **Data Consistency**: Guarantee consistency of entities within a project in one document
  - **Transaction Boundaries**: Process multiple changes within a project in one transaction
  - **Permission Management**: Natural access control per project
  - **Performance**: 2-layer architecture minimizes runtime impact even with large documents
  - **Security**: Separate management of account authentication information and user information
  - **Setting Separation**: Independent management of global settings and project-specific data
