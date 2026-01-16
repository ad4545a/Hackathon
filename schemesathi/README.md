# SchemeSathi - AI-Powered Government Scheme Assistant 🇮🇳

SchemeSathi is a mobile application designed to help users discover and understand government schemes they are eligible for. It features a rule-based eligibility engine and an **AI-powered Chatbot (powered by Google Gemini)** that provides instant, natural language answers to user queries about any scheme.

---

## 🚀 Features

-   **Eligibility Check**: Filters schemes based on Age, Income, Caste, Occupation, and State.
-   **AI Chatbot**: 
    -   Integrated with **Google Gemini Flash**.
    -   Context-aware: Answers questions specifically about the selected scheme.
    -   Dynamic: Generates unique responses for every question (no hardcoded text).
-   **Multi-language Support**: Supports English and Hindi.
-   **Robust Backend**: FastAPI server with Firestore database.

---

## 🛠️ Tech Stack

-   **Frontend**: Flutter (Dart)
-   **Backend**: Python (FastAPI)
-   **Database**: Firebase Firestore
-   **AI Model**: Google Gemini 1.5 Flash / Flash Latest

---

## ⚙️ Setup Instructions

### 1. Prerequisites
-   [Flutter SDK](https://docs.flutter.dev/get-started/install) installed.
-   [Python 3.10+](https://www.python.org/downloads/) installed.
-   A Google Cloud Project with **Firebase Firestore** enabled.
-   A **Google Gemini API Key** (Get it from [Google AI Studio](https://aistudio.google.com/)).

### 2. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd schemesathi/backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Firebase Setup**:
    -   Download your `serviceAccountKey.json` from Firebase Console -> Project Settings -> Service Accounts.
    -   Place it inside the `backend/` folder.
    -   Rename it to `serviceAccountKey.json` (if it has a different name).
4.  **Environment Variables**:
    -   Create a `.env` file in `backend/`:
        ```bash
        GEMINI_API_KEY=your_actual_api_key_here
        ```
5.  Run the Server:
    ```bash
    python main.py
    ```
    -   The server will start at `http://0.0.0.0:8000`.
    -   Swagger Docs: `http://localhost:8000/docs`

### 3. Frontend (App) Setup

1.  Navigate to the project root:
    ```bash
    cd schemesathi
    ```
2.  Install packages:
    ```bash
    flutter pub get
    ```
3.  **Configure API URL**:
    -   Open `lib/services/api_config.dart`.
    -   Ensure the URL points to your backend.
        -   **Emulator**: `http://10.0.2.2:8000`
        -   **Physical Device**: `http://<YOUR_LAPTOP_IP>:8000` (Make sure laptop and phone are on the same WiFi).
4.  Run the App:
    ```bash
    flutter run
    ```

---

## 📂 Project Structure

```
schemesathi/
├── backend/
│   ├── main.py              # FastAPI Entry Point
│   ├── models.py            # Pydantic Models
│   ├── services/
│   │   └── llm_service.py   # Google Gemini Integration Logic
│   └── requirements.txt     # Python Dependencies
├── lib/
│   ├── screens/             # UI Screens (Chat, Home, Results)
│   ├── services/            # API Services
│   └── main.dart            # Flutter Entry Point
└── README.md                # Project Documentation
```

## 🐛 Troubleshooting

-   **Backend 500 Error**: Check if `serviceAccountKey.json` is present and valid.
-   **Chatbot "Traffic" Error**: Verify your `GEMINI_API_KEY` in `.env` and check quota limits.
-   **App Connection Error**: Ensure your phone/emulator can reach the backend IP.
