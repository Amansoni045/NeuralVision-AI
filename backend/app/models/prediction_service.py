import os
import time
import base64
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Flatten, Conv2D, MaxPooling2D, Dropout
from backend.app.core.config import settings

class PredictionService:
    def __init__(self):
        self.perceptron = None
        self.ann = None
        self.cnn = None
        self.load_all_models()

    def build_perceptron(self):
        model = Sequential([
            Flatten(input_shape=(28, 28, 1)),
            Dense(10, activation="softmax")
        ])
        model.compile(optimizer="sgd", loss="categorical_crossentropy", metrics=["accuracy"])
        return model

    def build_ann(self):
        model = Sequential([
            Flatten(input_shape=(28, 28, 1)),
            Dense(128, activation="relu"),
            Dense(64, activation="relu"),
            Dense(10, activation="softmax")
        ])
        model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
        return model

    def build_cnn(self):
        model = Sequential([
            Conv2D(32, kernel_size=(3, 3), activation="relu", input_shape=(28, 28, 1)),
            MaxPooling2D(pool_size=(2, 2)),
            Conv2D(64, kernel_size=(3, 3), activation="relu"),
            MaxPooling2D(pool_size=(2, 2)),
            Flatten(),
            Dense(128, activation="relu"),
            Dropout(0.5),
            Dense(10, activation="softmax")
        ])
        model.compile(optimizer="sgd", loss="categorical_crossentropy", metrics=["accuracy"])
        return model

    def load_all_models(self):
        # Paths to saved models
        perceptron_path = os.path.join(settings.MODEL_DIR, "perceptron.keras")
        ann_path = os.path.join(settings.MODEL_DIR, "ann.keras")
        cnn_path = os.path.join(settings.MODEL_DIR, "cnn.keras")

        # Load or initialize models
        if os.path.exists(perceptron_path):
            try:
                self.perceptron = load_model(perceptron_path)
                print("Perceptron model loaded successfully.")
            except Exception as e:
                print(f"Error loading Perceptron: {e}. Reinitializing...")
                self.perceptron = self.build_perceptron()
        else:
            self.perceptron = self.build_perceptron()
            self.perceptron.save(perceptron_path)
            print("Perceptron model initialized and saved.")

        if os.path.exists(ann_path):
            try:
                self.ann = load_model(ann_path)
                print("ANN model loaded successfully.")
            except Exception as e:
                print(f"Error loading ANN: {e}. Reinitializing...")
                self.ann = self.build_ann()
        else:
            self.ann = self.build_ann()
            self.ann.save(ann_path)
            print("ANN model initialized and saved.")

        if os.path.exists(cnn_path):
            try:
                self.cnn = load_model(cnn_path)
                print("CNN model loaded successfully.")
            except Exception as e:
                print(f"Error loading CNN: {e}. Reinitializing...")
                self.cnn = self.build_cnn()
        else:
            self.cnn = self.build_cnn()
            self.cnn.save(cnn_path)
            print("CNN model initialized and saved.")

        # Force a forward pass to initialize Keras symbolic input and output nodes (fixes Grad-CAM bug)
        dummy_input = np.zeros((1, 28, 28, 1), dtype=np.float32)
        if self.perceptron is not None:
            self.perceptron(dummy_input)
        if self.ann is not None:
            self.ann(dummy_input)
        if self.cnn is not None:
            self.cnn(dummy_input)

    def preprocess_image(self, base64_str: str) -> np.ndarray:
        """
        Decode a base64 image, convert to grayscale, resize to 28x28, 
        normalize and return as shape (28, 28, 1).
        """
        # Decode base64 image
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        
        image_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

        # Handle RGBA/RGB channels
        if len(img.shape) == 3 and img.shape[2] == 4:
            # Extract alpha channel if transparency exists, or convert to gray
            # If drawing on a transparent canvas, draw brush strokes might be colored and background alpha is 0
            # Let's check if the alpha channel is active
            alpha = img[:, :, 3]
            # Replace transparent parts with black, and non-transparent with gray/white
            gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
            # Use alpha channel mask to ensure background is black
            gray = cv2.bitwise_and(gray, gray, mask=alpha)
        elif len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        # Resize to 28x28 using cubic interpolation for smoother edges
        resized = cv2.resize(gray, (28, 28), interpolation=cv2.INTER_CUBIC)

        # MNIST is white digits on black background.
        # Check if the drawing background is light or dark.
        # Calculate mean intensity of corners/edges to determine background color.
        edge_pixels = np.concatenate([
            resized[0, :], resized[-1, :], resized[:, 0], resized[:, -1]
        ])
        edge_mean = np.mean(edge_pixels)
        
        if edge_mean > 127:
            # Background is light (white canvas with black drawing), invert colors
            resized = cv2.bitwise_not(resized)

        # Normalize to [0, 1]
        normalized = resized.astype("float32") / 255.0
        
        # Reshape to (28, 28, 1)
        normalized = np.expand_dims(normalized, axis=-1)
        
        return normalized

    def predict(self, model_type: str, preprocessed_img: np.ndarray):
        """
        Run prediction using designated model, measure latency.
        """
        # Add batch dimension -> (1, 28, 28, 1)
        input_data = np.expand_dims(preprocessed_img, axis=0)

        if model_type == "perceptron":
            model = self.perceptron
        elif model_type == "ann":
            model = self.ann
        elif model_type == "cnn":
            model = self.cnn
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        start_time = time.time()
        predictions = model.predict(input_data, verbose=0)[0]
        end_time = time.time()

        latency_ms = (end_time - start_time) * 1000.0
        predicted_class = int(np.argmax(predictions))
        confidence = float(predictions[predicted_class])
        all_confidences = [float(p) for p in predictions]

        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "all_confidences": all_confidences,
            "latency_ms": latency_ms
        }

prediction_service = PredictionService()
