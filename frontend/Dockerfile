FROM oven/bun:1.3.9

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source files
COPY . .

# Expose port
EXPOSE 3000

# Start dev server
CMD ["bun", "dev"]