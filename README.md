# AI-Powered-Real-Time-Parking-Intelligence-Platform
An AI-powered smart parking system that combines real-time computer vision, a mobile app, and a web platform to automate parking management end-to-end.

## Project Structure

```
smart-parking-system/
├── ai-services/
│   ├── lpr/              # License Plate Recognition system
│   └── slot-detection/   # Parking slot detection system
├── backend/              # Spring Boot REST API (Java) 
├── mobile-app/           # Mobile application (Flutter)
├── web-app/              # User web interface (React)
├── admin-dashboard/      # Admin web interface (React)
```

### Setup

#### Clone the Repository

```bash
git clone 
cd smart-parking-system
```

#### AI Services

**License Plate Recognition (LPR)**
```bash
cd ai-services/lpr
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env    # fill in DB credentials
python main.py
```

**Slot Detection**
```bash
cd ai-services/slot-detection
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
python auto_calibrate.py    # recalibrate slot regions
python test_detection.py    # run detection tests
```
### Backend

```bash
cd backend
./mvnw spring-boot:run     # start dev server
```

### Web App

```bash
cd web-app
npm install 
npm run dev     # dev server at http://localhost:5173
```

### Admin Dashboard

```bash
cd admin-dashboard
npm install
npm run dev
```

### Mobile App

```bash
cd mobile_app
flutter pub get
flutter run
```