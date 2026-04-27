# 🎓 UniAttend - Student Attendance Management System

![Next.js](https://img.shields.io/badge/Next.js-Black?style=for-the-badge&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**UniAttend** is a comprehensive full-stack web application tailored specifically for university students to track their academic attendance in real-time, ensuring they meet mandatory exam requirements.

---

## 🚀 The Core Problem & Motivation

In our university, it is a strict academic policy that students must maintain a minimum of **80% attendance** to be eligible to sit for their final examinations. 

Recently, a heartbreaking situation occurred where a significant number of my own batchmates at the **Trincomalee Campus, Eastern University, Sri Lanka**, were disqualified from taking their exams. The primary reason wasn't a lack of effort, but a lack of visibility—they simply had no real-time way to calculate and track their attendance percentages against the total conducted hours.

Seeing my friends lose their hard-earned exam opportunities inspired me to build a solution. I developed **UniAttend** specifically for my batchmates. This system eliminates the guesswork, providing a transparent, real-time dashboard so that no student ever misses an exam again due to a miscalculated attendance percentage.

## ✨ Key Features

### 👤 For Students
- **Real-Time Dashboard:** View exactly how many hours you have attended versus the total hours conducted for each specific subject.
- **Dynamic Percentage Calculation:** Instantly calculates your attendance percentage. It highlights in **Green** if you are above the safe 80% mark, and in **Red** if you are at risk.
- **One-Click Logging:** A simple, intuitive interface to log daily attended hours.
- **History Tracking:** Review previously logged attendance records to ensure accuracy.
- **Gamified Leaderboard 🏆:** A ranking system that displays batchmates' overall attendance percentages, encouraging healthy competition and better attendance rates.

### 🛡️ For Administrators
- **Subject Management:** Admins can dynamically update the "Total Conducted Hours" for any subject as the semester progresses.
- **User Credential Management:** Ability to securely reset passwords for students who lose their login access.

## 🛠️ Technical Architecture

This application was built with modern web technologies to ensure scalability, speed, and security.

- **Frontend:** Built with **Next.js (App Router)** for fast rendering and seamless routing.
- **Styling:** **Tailwind CSS** for a fully responsive, mobile-first, and clean user interface.
- **Database & Authentication:** **Supabase (PostgreSQL)** handles secure user authentication, row-level security (RLS), and real-time database queries.
- **Deployment:** Hosted on **Vercel** for continuous integration and rapid deployment.

---

## ⚙️ Local Development Setup

If you wish to clone this repository and run the project locally on your machine, follow these steps:

### Prerequisites
- Node.js installed on your machine.
- A Supabase account and project.

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/VisuraLokithaDeSilva/uni-attend.git](https://github.com/VisuraLokithaDeSilva/uni-attend.git)
