# AI-Powered-Real-Time-Parking-Intelligence-Platform

## Project Structure

```
smart-parking-system/
├── ai-services/
│   ├── lpr/              # License Plate Recognition system
│   └── slot-detection/   # Parking slot detection system
├── backend/              # API server 
├── mobile-app/           # Mobile application
├── user-website/         # User web interface
├── admin-dashboard/      # Admin web interface 
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
```
Run:
```bash
python main.py
```

**Slot Detection**
```bash
cd ai-services/slot-detection
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
Run:
```bash
python main.py
```
