from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
import torchvision.transforms as transforms
import pickle
from datetime import datetime
import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os

# 👇 Gemini
from google import genai

app = FastAPI(title="Medical AI Backend")

# CORS for mobile apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    image = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(image)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probs, 1)
    return class_names[predicted.item()], confidence.item() * 100

# ----------------------------
# Gemini enhanced report (multi-language)
# ----------------------------
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def generate_gemini_report(prediction, confidence, scan_type, name, age, gender, language="English"):
    """
    language: "English", "Malayalam", "Kannada", "Hindi"
    """
    prompt = f"""
You are an expert medical doctor. A medical AI system has analyzed a {scan_type} of a patient:
• Prediction: {prediction}
• Confidence: {confidence:.2f}%

Patient details:
• Name: {name}
• Age: {age}
• Gender: {gender}

Write a professional medical report in {language} including:
1) Clinical observations
2) Interpretation of findings
3) Whether there is a problem
4) Confidence insights
5) Recommended next steps / treatments
6) Urgency level (admit, consult specialist, routine follow-up)
7) Short summary paragraph for the patient

Use clear, professional language suitable for a patient-friendly medical report.
"""

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",  # latest Gemini model
        contents=[{"text": prompt}]
    )

    return response.text

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
        y -= 14
        if y < 40:
            c.showPage()
            y = height - 40

    c.save()
    buffer.seek(0)
    return buffer

# ----------------------------
# Analyze endpoint
# ----------------------------
@app.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    model_type: str = Form(...),
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    language: str = Form("English")  # default English
):

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")

    if model_type == "chest":
        label, conf = predict(image, chest_model, ["NORMAL", "PNEUMONIA"])
        scan_type = "Chest X-ray"
    elif model_type == "brain":
        label, conf = predict(image, brain_model, ["NORMAL", "TUMOR"])
        scan_type = "Brain MRI"
    else:
        label, conf = predict(image, lung_model, ["NORMAL", "CANCER"])
        scan_type = "Lung CT Scan"

    gemini_report = generate_gemini_report(label, conf, scan_type, name, age, gender, language)

    return {
        "prediction": label,
        "confidence": round(conf, 2),
        "scan_type": scan_type,
        "patient": {"name": name, "age": age, "gender": gender},
        "report": gemini_report,
        "language": language
    }

# ----------------------------
# Download PDF
# ----------------------------
@app.post("/download-report")
async def download_report(report: str = Form(...)):
    pdf_buffer = create_pdf(report)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=medical_report.pdf"}
    )