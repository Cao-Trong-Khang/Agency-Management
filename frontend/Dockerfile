FROM node:22-alpine

WORKDIR /app

# Copy lockfile và cài đặt sạch dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy toàn bộ mã nguồn
COPY . .

EXPOSE 5173

# Bắt buộc cờ --host 0.0.0.0 để container lắng nghe traffic từ máy host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
