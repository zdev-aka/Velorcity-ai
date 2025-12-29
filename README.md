# 🚀 Velorcity AI Chat

**Velorcity AI** là một giao diện chat hiện đại, hiệu năng cao được xây dựng để khai phá sức mạnh của Cerebras Inference và Google Gemini. Dự án tập trung vào trải nghiệm người dùng mượt mà với ngôn ngữ thiết kế Neo-brutalism và khả năng xử lý công cụ (Tool Use) thông minh.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)

---

## ✨ Tính năng nổi bật

- ⚡ **Siêu tốc độ:** Tận dụng Cerebras Llama-3.3-70B cho phản hồi AI gần như tức thì.
- 🎨 **Neo-brutalism UI:** Giao diện cá tính, hỗ trợ Dark/Light mode và hiệu ứng Boot Sequence độc đáo.
- 🛠️ **Hệ thống Tool Use:** Hỗ trợ AI tự động gọi các công cụ như:
  - Tra cứu thời tiết thời gian thực.
  - Tạo và cập nhật Artifacts (tài liệu/code snippet).
  - Tìm kiếm tài liệu kỹ thuật.
- 🌍 **Đa ngôn ngữ:** Hỗ trợ Tiếng Việt và Tiếng Anh.
- 📦 **Artifacts Viewer:** Xem và quản lý các đoạn mã hoặc văn bản dài trong một cửa sổ riêng biệt chuyên nghiệp.

## 🛠️ Công nghệ sử dụng

- **Frontend:** React 18, TypeScript, Vite.
- **Styling:** Tailwind CSS, Lucide Icons.
- **Animation:** Framer Motion.
- **AI Integration:** Vercel AI SDK, Cerebras API, Google Generative AI.

---

## 🚀 Hướng dẫn chạy dự án

### 1. Yêu cầu hệ thống
- Node.js (phiên bản 18.0 trở lên)
- npm hoặc yarn

### 2. Cài đặt

Mở terminal và chạy các lệnh sau:

```bash
# Clone dự án
git clone [https://github.com/zdev-aka/Velorcity-ai.git](https://github.com/zdev-aka/Velorcity-ai.git)

# Di chuyển vào thư mục dự án
cd Velorcity-ai

# Cài đặt các thư viện phụ thuộc
npm install
```

### 3. Cấu hình biến môi trường

#### Vào file `.env.local` và điền:
```bash
# Go to https://www.cerebras.ai/inference and start generating your API key.
# Then enter your API key below, for example:
# VITE_CEREBRAS_API_KEY=csk-21dushd87msaindcuafb7qnmdnsfhasdasdweqg45uyj...
VITE_CEREBRAS_API_KEY=<API CEREBRAS HERE>
```

### 4. Chạy ứng dụng
```bash
npm run dev
```
Truy cập: `http://localhost:3000`

---

### 🤝 Đóng góp
Mọi đóng góp nhằm cải thiện dự án đều được trân trọng!
- Fork dự án.
- Tạo nhánh tính năng (git checkout -b feature/AmazingFeature).
- Commit thay đổi (git commit -m 'Add some AmazingFeature').
- Push lên nhánh (git push origin feature/AmazingFeature).
- Mở một Pull Request.
---
## Copyright (c) 2025 ZDEV