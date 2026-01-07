# CROWD COUNT – People Counting Using Video Analysis 📹👥

---

## 📌 Project Overview

**CROWD COUNT – People Counting Using Video Analysis** is a real-time intelligent surveillance and analytics system designed to monitor crowd density using video feeds.  
The system detects and tracks people using deep learning models, counts individuals within defined zones, and presents insights through interactive dashboards for both **Admin** and **User** roles.

This project is developed as part of the **Infosys Springboard Program** and is implemented incrementally across **four milestones**, integrating computer vision, backend APIs, role-based authentication, and modern dashboards.

---

## 🎯 Objectives

- Detect and count people from live or recorded video streams  
- Divide the camera view into multiple zones and count people per zone  
- Provide real-time analytics and visualizations  
- Enable role-based access for **Admin** and **User**  
- Allow Admin to manage zones, thresholds, and exports  
- Generate downloadable reports (CSV / PDF)

---

## 🧩 System Architecture

Camera / Video Feed
->
YOLOv8 Person Detection
->
Deep SORT Tracking
->
Zone-wise Counting Logic
->
Flask Backend API
->
JWT Authentication
->
Admin Dashboard / User Dashboard

---

## 🔑 User Roles & Permissions

### 👤 User
- View total people count  
- View zone-wise statistics  
- View people count over time  
- View zone distribution chart  
- View activity heatmap  
- **Read-only access** (no modifications)

---

### 👨‍💼 Admin
- Access Admin Dashboard after login  
- Zone Management (zone-wise count + threshold setting)  
- Analytics Overview  
- Export data as **CSV / PDF**  
- Camera zone visualization  
- User login activity tracking (basic)  
- Secure logout  

---

## 🚀 Milestone Breakdown

### 🔹 Milestone 1 – Zone Creation & Camera Handling
- Live camera feed integration  
- Mouse-based zone creation  
- Save and load zones dynamically  

---

### 🔹 Milestone 2 – People Detection & Zone Counting
- YOLOv8 for person detection  
- Deep SORT for tracking  
- Zone-wise counting logic  
- Backend update API integration  

---

### 🔹 Milestone 3 – Dashboard & Analytics
**User Dashboard Features**
- Total people count  
- Zone distribution chart  
- People count over time  
- Heatmap visualization  
- Real-time updates using REST APIs  

---

### 🔹 Milestone 4 – Admin Panel & Role-Based Access
- JWT authentication  
- Admin & User role separation  
- Admin sidebar controls  
- Threshold management  
- Export reports (CSV / PDF)  
- Unified professional UI  

---

## 📊 Dashboard Features

### 📈 Analytics
- **Line Chart:** People Count Over Time  
- **Bar Chart:** Zone-wise Distribution  
- **Heatmap:** Crowd Density Visualization  

---

### ⚙️ Admin Controls
- Zone Management with live counts  
- Threshold adjustment  
- Export CSV / PDF reports  
- Camera zone visualization  
- Secure logout  

---

## 🛠️ Technologies Used

- Python  
- Flask  
- YOLOv8 (Ultralytics)  
- Deep SORT  
- OpenCV  
- JWT Authentication  
- HTML, CSS (Purple UI Theme)  
- JavaScript  
- Chart.js  

---

## ✅ Key Highlights

- Real-time crowd monitoring  
- Role-based access control  
- Interactive and modern UI  
- Scalable architecture  
- Industry-aligned implementation  

---

## 🏁 Conclusion

The **CROWD COUNT – People Counting Using Video Analysis** project successfully demonstrates the integration of **computer vision**, **backend services**, and **interactive dashboards** into a single cohesive system.

It provides accurate real-time insights, secure role-based access, and an extensible architecture, making it suitable for **smart surveillance**, **public safety**, and **crowd management applications**.

---
