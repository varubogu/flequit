# Database Schema

The schema entity name will be "flequit_XXXX", but for the sake of simplicity in the design document, it will be abbreviated as "XXXX".

## 1. schema: tasks

Representing the structure of a task.
Schema usage target: All types of devices and mode
Local file sync: yes
Web sync: yes

## 2. schema: tasks_archive

Archive of tasks.
Schema usage target: All types of devices and mode
Local file sync: yes
Web sync: yes

## 3. schema: sync_logs

Save a log of the synchronization
Schema usage target: Server sync mode of All devices
Local file sync: yes
Web sync: no (Logging on the server side, not the client side)

## 4. schema: users

User information.
Schema usage target: Server sync mode of All devices

## 5. schema: sessions

Session information.
Schema usage target: Server sync mode of All devices
