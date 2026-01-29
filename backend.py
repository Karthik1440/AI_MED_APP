from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from PIL import Image
import torch
import torchvision.transforms as transforms
import pickle
from datetime import datetime
import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

app = FastAPI(title="Medical AI Backend")

# ----------------------------
# Load models
# ----------------------------
def load_model(path):
    with open(path, "rb") as f:
        model = pickle.load(f)
    model.eval()
    return model

chest_model = load_model("models/chest_xray.pkl")
brain_model = load_model("models/brain_tumor.pkl")
lung_model  = load_model("models/lung_cancer.pkl")

device = torch.device("cpu")

# ----------------------------
# Image preprocessing
# ----------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def predict(image, model, class_names):
    image = transform(image).unsqueeze(0)
    image = image.to(device)

    with torch.no_grad():
        outputs = model(image)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probs, 1)

    return class_names[predicted.item()], confidence.item() * 100

# ----------------------------
# Generate report
# ----------------------------
def generate_report(disease, confidence, model_type, name, age, gender):

    if disease.upper() == "NORMAL":
        risk = "Low Risk"
        advice = "No immediate concern detected. Regular monitoring is suggested."
    else:
        if confidence >= 85:
            risk = "High Risk"
            advice = "Immediate medical consultation is strongly recommended."
        elif confidence >= 60:
            risk = "Moderate Risk"
            advice = "A clinical consultation is recommended."
        else:
            risk = "Low Risk"
            advice = "Further diagnostic tests may be required for confirmation."

    report = f"""AI Medical Diagnostic Report

Patient Information:
Name: {name}
Age: {age}
Gender: {gender}

Scan Details:
Scan Type: {model_type}
Date: {datetime.now().strftime('%d-%m-%Y %H:%M')}

AI Findings:
The AI system analyzed the uploaded medical image and detected patterns commonly associated with "{disease}".

Confidence Score:
{confidence:.2f}% ({risk})

Clinical Interpretation:
This result suggests a {risk.lower()} likelihood of the detected condition.

Medical Recommendation:
{advice}

Disclaimer:
This AI-generated report is for educational purposes only and should not replace professional medical advice.
"""
    return report

# ----------------------------
# Create PDF
# ----------------------------
def create_pdf(report_text):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 40

    for line in report_text.split("\n"):
        c.drawString(40, y, line)
        y -= 15
        if y < 40:
            c.showPage()
            y = height - 40

    c.save()
    buffer.seek(0)
    return buffer

# ----------------------------
# API Endpoint
# ----------------------------
@app.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    model_type: str = Form(...),
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...)
):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    if model_type == "chest":
        label, conf = predict(image, chest_model, ["NORMAL", "PNEUMONIA"])
        scan_type = "Chest X-ray"

    elif model_type == "brain":
        label, conf = predict(image, brain_model, ["NORMAL", "TUMOR"])
        scan_type = "Brain MRI"

    else:
        label, conf = predict(image, lung_model, ["CANCER", "NORMAL"])
        scan_type = "Lung CT Scan"

    report = generate_report(label, conf, scan_type, name, age, gender)

    return {
        "prediction": label,
        "confidence": round(conf, 2),
        "scan_type": scan_type,
        "patient": {
            "name": name,
            "age": age,
            "gender": gender
        },
        "report": report
    }

# ----------------------------
# Download PDF endpoint
# ----------------------------
@app.post("/download-report")
async def download_report(report: str = Form(...)):
    pdf_buffer = create_pdf(report)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=medical_report.pdf"}
    )
