# Stage 1: Build
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
# ชี้ไปที่ ./cmd/server เพราะ main.go อยู่ที่นั่น
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main ./cmd/server

# Stage 2: Production Run
FROM alpine:latest

WORKDIR /app

# Timezone setting (Thailand)
RUN apk add --no-cache tzdata
ENV TZ=Asia/Bangkok

# Copy binary from builder
COPY --from=builder /app/main .

# สร้างโฟลเดอร์ uploads รอไว้ (เผื่อ volume ไม่ map)
RUN mkdir -p uploads/settings uploads/documents

EXPOSE 8080

CMD ["./main"]