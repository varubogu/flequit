# Data Structure Design

## Overview

This document explains the design of data structures used in the Flequit application.

## Data Structure Groups

The data is organized into the following groups:

- User Settings
- Projects
- User List

### User Settings

**Storage Format**: JSON file

User settings manage personal user configurations.
This data is stored locally and synchronized with servers or cloud storage as needed.

### Projects

**Storage Format**: Automerge, SQLite, PostgreSQL (on server)

Manages data related to projects.
This data is stored locally and synchronized with servers or cloud storage as needed.

The program retrieves data from SQLite rather than directly from Automerge, reflecting Automerge data to SQLite.
This ensures optimized performance through SQLite even when Automerge documents become large.

For project data:

- In the app and database: All data must have a project ID as a key since multiple projects are integrated.
- In Automerge documents: Since there is one document per project, project IDs do not need to be stored in each table.

### User List

**Storage Format**: Automerge, SQLite

The user list manages the list of users.
This data is stored locally and synchronized with servers or cloud storage as needed.

The program retrieves data from SQLite rather than directly from Automerge, reflecting Automerge data to SQLite.
This ensures optimized performance through SQLite even when Automerge documents become large.
