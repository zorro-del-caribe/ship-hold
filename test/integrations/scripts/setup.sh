#!/bin/sh
# Run postgres container as daemon and create a test db
echo "Starting DB..."
docker run --name ship-hold --rm -d -e POSTGRES_PASSWORD=docker -e POSTGRES_USER=docker -e POSTGRES_DB=ship-hold-test -p 5432:5432 postgres:latest
