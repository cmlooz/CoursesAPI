#!/bin/bash

# Wait for PostgreSQL to start
while ! pg_isready -h localhost -p 5432 -U postgres; do
 sleep 1
done

# Execute command
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE courses_db;"

# Add more commands if needed