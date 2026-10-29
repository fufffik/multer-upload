#!/bin/bash
# Запускать при работающем сервере (порт 3000)
B=http://localhost:3000
echo "fake image content" > test.jpg
echo "test" > test.txt
echo "--- avatar";    curl -s -w "\nHTTP %{http_code}\n" -X POST $B/upload/avatar -F "avatar=@test.jpg"
echo "--- wrong type"; curl -s -w "\nHTTP %{http_code}\n" -X POST $B/upload/avatar -F "avatar=@test.txt"
echo "--- documents"; curl -s -w "\nHTTP %{http_code}\n" -X POST $B/upload/documents -F "documents=@test.txt" -F "documents=@test.txt"
echo "--- profile";   curl -s -w "\nHTTP %{http_code}\n" -X POST $B/upload/profile -F "name=Alice" -F "bio=Backend developer" -F "avatar=@test.jpg"
