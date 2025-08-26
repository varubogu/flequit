#!/bin/bash
cargo run -j 4 --bin migration_runner -- ../.tmp/tests/test_database.db
