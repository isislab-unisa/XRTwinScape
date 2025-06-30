# Use official Node.js LTS image
FROM node:18-slim

# Set working directory
WORKDIR /

# Copy package.json and package-lock.json (if present)
COPY package.json ./
# If you use package-lock.json, uncomment the next line
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the project
RUN npm run build

# Expose the port your app runs on (default for serve is 3000)
EXPOSE 3000

# Start the app using the "develop" script (change as needed)
CMD ["npm", "run", "develop"]