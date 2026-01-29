import streamlit as st
import torch
import torchvision.transforms as transforms
from PIL import Image
import pickle
from datetime import datetime
import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas




# ----------------------------
# Load models
# ----------------------------
@st.cache_resource
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
# Generate AI Medical Report (English only)
# ----------------------------
def generate_report_english(disease, confidence, model_type, name, age, gender):
    # Risk logic
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
This result suggests a {risk.lower()} likelihood of the detected condition. The AI model highlights visual features such as abnormal textures, intensity variations, or structural deviations compared to healthy scans.

Medical Recommendation:
{advice}
A licensed doctor or radiologist should perform clinical evaluation and may recommend additional tests.

"""
    return report

# ----------------------------
# Save report as PDF
# ----------------------------
def save_report_pdf(report_text):
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
# Streamlit UI
# ----------------------------
st.set_page_config(page_title="Medical AI Diagnosis", page_icon="🧠")

st.title("🧠 AI-Powered Medical Image Diagnosis")
st.write("Upload a medical image and receive AI-assisted analysis with professional report in English.")

# Patient details
st.subheader("👤 Patient Information")
patient_name = st.text_input("Patient Name")
age = st.number_input("Age", min_value=0, max_value=120)
gender = st.selectbox("Gender", ["Male", "Female", "Other"])

# Model selection
option = st.selectbox(
    "Select Diagnosis Model",
    ["Chest X-ray (Pneumonia)", "Brain MRI (Tumor)", "Lung CT (Cancer)"]
)

# Upload image
uploaded_file = st.file_uploader("Upload medical image", type=["jpg", "png", "jpeg"])

if uploaded_file:
    image = Image.open(uploaded_file).convert("RGB")
    st.image(image, caption="Uploaded Image", use_column_width=True)

    if st.button("Analyze Image"):
        with st.spinner("Analyzing..."):

            if option == "Chest X-ray (Pneumonia)":
                label, conf = predict(image, chest_model, ["NORMAL", "PNEUMONIA"])
                model_type = "Chest X-ray"

            elif option == "Brain MRI (Tumor)":
                label, conf = predict(image, brain_model, ["NORMAL", "TUMOR"])
                model_type = "Brain MRI"

            else:
                label, conf = predict(image, lung_model, ["CANCER", "NORMAL"])
                model_type = "Lung CT Scan"

        st.success(f"Prediction: {label}")
        st.info(f"Confidence: {conf:.2f}%")

        # Generate report in English
        report = generate_report_english(
            label, conf, model_type,
            patient_name, age, gender
        )

        st.subheader("📝 Generated Medical Report")
        st.text_area("", report, height=350)

        # Download PDF
        pdf_buffer = save_report_pdf(report)
        st.download_button(
            label="📄 Download Report as PDF",
            data=pdf_buffer,
            file_name="medical_report.pdf",
            mime="application/pdf"
        )

