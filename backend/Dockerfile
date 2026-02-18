FROM golang:1.25-alpine

WORKDIR /app

# Install essentials
RUN apk add --no-cache git

# Install Air for live reload
RUN go install github.com/air-verse/air@latest

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Expose port
EXPOSE 8080

# Command to run air
CMD ["air", "-c", ".air.toml"]