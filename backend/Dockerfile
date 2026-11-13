FROM node:22-alpine

WORKDIR /app

# Copy lockfile và cài đặt sạch dependencies (bao gồm devDependencies cho nodemon)
COPY package.json package-lock.json ./
RUN npm ci

# Copy toàn bộ mã nguồn
COPY . .

EXPOSE 3000

CMD ["npm", "run", "server"]
