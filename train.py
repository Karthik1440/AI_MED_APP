# train.py
import torch
import torchvision.transforms as transforms
from torchvision.datasets import ImageFolder
from torch.utils.data import DataLoader
from torchvision import models
import torch.nn as nn
import pickle
import os

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def train_and_save(data_dir, save_path, epochs=3):
    transform = transforms.Compose([
        transforms.Resize((224,224)),
        transforms.ToTensor()
    ])

    dataset = ImageFolder(data_dir, transform=transform)
    loader = DataLoader(dataset, batch_size=8, shuffle=True)

    model = models.resnet18(pretrained=True)
    model.fc = nn.Linear(model.fc.in_features, len(dataset.classes))
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    print(f"Training {data_dir} ... Classes: {dataset.classes}")

    for epoch in range(epochs):
        running_loss = 0.0
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        print(f"Epoch {epoch+1}/{epochs}, Loss: {running_loss/len(loader):.4f}")

    os.makedirs("models", exist_ok=True)
    with open(save_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Model saved: {save_path}\n")

# Train all three models
train_and_save("dataset/chest", "models/chest_xray.pkl")
train_and_save("dataset/brain", "models/brain_tumor.pkl")
train_and_save("dataset/lung", "models/lung_cancer.pkl")
