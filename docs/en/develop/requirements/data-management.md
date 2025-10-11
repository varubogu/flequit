# Data Management and Synchronization

## Overview

This document explains the data management approach for the application. It consists of two elements: "File Storage Location" and "Synchronization Method".

### Requirements

Based on distributed system principles, the application should be local-first and support various synchronization methods.

## File Storage Location

### SQLite (Local File)

- **Target Platforms**: Desktop/Mobile
- **Features**:
  - Highest security
  - Offline operation capability
  - SQLCipher encryption support
  - Available even in strict security environments

### IndexedDB (Browser Storage)

- **Target Platforms**: Web
- **Features**:
  - Local storage within browser
  - Browser-based operation as SQLite alternative
  - Browser-dependent data management

## Synchronization Methods

### No Synchronization

- **Description**: Operation with local files only
- **Features**: Highest security, offline completion
- **Account**: Not required

### Cloud Storage Synchronization

- **Description**: Synchronization with arbitrary cloud storage servers
- **Features**:
  - Self-hosted server operation possible
  - High security
  - Synchronization using differential data schema
- **Account**: Optional

### Flequit Official Server Synchronization

- **Description**: Synchronization using Flequit official servers
- **Features**:
  - Standard operation for general users
  - Server synchronization using differential data
- **Account**: Required

### Git Synchronization

- **Description**: Synchronization using Git and Git-compatible services
- **Features**:
  - For developers
  - JSON file format management
  - Directory structure per project/list
  - One JSON file per task
  - Differential management using activity records
  - High security with private repositories
  - No cloud storage costs
- **Account**: Optional

## Compatibility Matrix

| File Storage \ Sync Method | No Sync | Cloud Storage | Flequit Official | Git Sync |
| -------------------------- | ------- | ------------- | ---------------- | -------- |
| **SQLite (Local)**         | ✅      | ✅            | ✅               | ✅       |
| **IndexedDB (Browser)**    | ✅      | ❌            | ✅               | ❌       |

## Implemented Mode Combinations

### SQLite + No Synchronization

- **Official Name**: Local File Mode
- **Combination**: SQLite (Local) + No Synchronization
- **Target**: Desktop/Mobile Apps
- **Account**: Not required

### SQLite + Cloud Storage Synchronization

- **Official Name**: Local + Cloud Storage Sync Mode
- **Combination**: SQLite (Local) + Cloud Storage Synchronization
- **Target**: Desktop/Mobile Apps
- **Account**: Optional

### SQLite + Flequit Official Server Synchronization

- **Official Name**: Local + Web Sync Mode
- **Combination**: SQLite (Local) + Flequit Official Server Synchronization
- **Target**: Desktop/Mobile Apps
- **Account**: Required

### SQLite + Git Synchronization

- **Official Name**: Local + Git Sync Mode
- **Combination**: SQLite (Local) + Git Synchronization
- **Target**: Desktop/Mobile Apps
- **Account**: Optional

### IndexedDB + No Synchronization

- **Official Name**: Web Browser IndexedDB Mode
- **Combination**: IndexedDB (Browser) + No Synchronization
- **Target**: Web Application
- **Account**: Not required

### IndexedDB + Flequit Official Server Synchronization

- **Official Name**: Web Server Sync Mode
- **Combination**: IndexedDB (Browser) + Flequit Official Server Synchronization
- **Target**: Web Application
- **Account**: Required
