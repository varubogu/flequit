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
- Delete: **Logical deletion only** (no physical deletion)

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

- Operations on logically deleted or physically deleted entities fail
- Return as RepositoryError

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
