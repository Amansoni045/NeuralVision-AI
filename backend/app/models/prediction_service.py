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
        self.model_status = {
            "perceptron": {"status": "unknown", "error": None},
            "ann": {"status": "unknown", "error": None},
            "cnn": {"status": "unknown", "error": None}
        }
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
        model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
        return model

    def train_model_on_mnist(self, model, save_path):
        print(f"Starting automatic fallback training on MNIST for {save_path}...")
        try:
            (X_train, y_train), (X_test, y_test) = tf.keras.datasets.mnist.load_data()
            X_train = X_train.astype("float32") / 255.0
            X_test = X_test.astype("float32") / 255.0
            X_train = np.expand_dims(X_train, -1)
            X_test = np.expand_dims(X_test, -1)
            y_train_cat = tf.keras.utils.to_categorical(y_train, 10)
            y_test_cat = tf.keras.utils.to_categorical(y_test, 10)
            
            # Train for 5 epochs - Adam models converge quickly and reliably on MNIST
            model.fit(
                X_train, y_train_cat,
                epochs=5,
                batch_size=128,
                validation_data=(X_test, y_test_cat),
                verbose=1
            )
            model.save(save_path)
            print(f"Fallback training complete. Model saved to {save_path}")
            return True
        except Exception as train_error:
            print(f"Fallback training failed: {train_error}")
            return False

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
                self.model_status["perceptron"] = {"status": "loaded", "error": None}
            except Exception as e:
                print(f"Error loading Perceptron: {e}. Running fallback training...")
                self.perceptron = self.build_perceptron()
                success = self.train_model_on_mnist(self.perceptron, perceptron_path)
                self.model_status["perceptron"] = {
                    "status": "fallback_trained" if success else "failed_load_reinitialized",
                    "error": str(e)
                }
        else:
            self.perceptron = self.build_perceptron()
            success = self.train_model_on_mnist(self.perceptron, perceptron_path)
            print("Perceptron model initialized and saved.")
            self.model_status["perceptron"] = {
                "status": "fallback_trained" if success else "initialized_new",
                "error": None
            }

        if os.path.exists(ann_path):
            try:
                self.ann = load_model(ann_path)
                print("ANN model loaded successfully.")
                self.model_status["ann"] = {"status": "loaded", "error": None}
            except Exception as e:
                print(f"Error loading ANN: {e}. Running fallback training...")
                self.ann = self.build_ann()
                success = self.train_model_on_mnist(self.ann, ann_path)
                self.model_status["ann"] = {
                    "status": "fallback_trained" if success else "failed_load_reinitialized",
                    "error": str(e)
                }
        else:
            self.ann = self.build_ann()
            success = self.train_model_on_mnist(self.ann, ann_path)
            print("ANN model initialized and saved.")
            self.model_status["ann"] = {
                "status": "fallback_trained" if success else "initialized_new",
                "error": None
            }

        if os.path.exists(cnn_path):
            try:
                self.cnn = load_model(cnn_path)
                print("CNN model loaded successfully.")
                self.model_status["cnn"] = {"status": "loaded", "error": None}
            except Exception as e:
                print(f"Error loading CNN: {e}. Running fallback training...")
                self.cnn = self.build_cnn()
                success = self.train_model_on_mnist(self.cnn, cnn_path)
                self.model_status["cnn"] = {
                    "status": "fallback_trained" if success else "failed_load_reinitialized",
                    "error": str(e)
                }
        else:
            self.cnn = self.build_cnn()
            success = self.train_model_on_mnist(self.cnn, cnn_path)
            print("CNN model initialized and saved.")
            self.model_status["cnn"] = {
                "status": "fallback_trained" if success else "initialized_new",
                "error": None
            }

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
        Decode a base64 image, crop the digit, resize it to fit in a 20x20 box
        preserving aspect ratio, center it in a 28x28 image using center of mass,
        normalize and return as shape (28, 28, 1).
        """
        # Decode base64 image
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        
        image_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if img is None:
            return np.zeros((28, 28, 1), dtype=np.float32)

        # Handle RGBA/RGB channels
        if len(img.shape) == 3 and img.shape[2] == 4:
            alpha = img[:, :, 3]
            gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
            gray = cv2.bitwise_and(gray, gray, mask=alpha)
        elif len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        # Apply Gaussian Blur to smooth camera sensor noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Use Otsu's thresholding to dynamically find the optimal foreground threshold
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # In MNIST, digits are white on a black background (foreground occupies less than 50% area).
        # If the thresholded image is mostly white (>50% mean), we invert the mask.
        if np.mean(thresh) > 127:
            thresh = cv2.bitwise_not(thresh)

        # Find the bounding box of the digit on our normalized white-on-black mask
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if len(contours) > 0:
            # Get bounding box of the largest contour (the digit)
            c = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(c)
            
            # Crop the digit from the binary mask with a small margin
            margin = 3
            x_start = max(0, x - margin)
            y_start = max(0, y - margin)
            x_end = min(thresh.shape[1], x + w + margin)
            y_end = min(thresh.shape[0], y + h + margin)
            cropped = thresh[y_start:y_end, x_start:x_end]

            # Resize the cropped digit to fit within 20x20 keeping the aspect ratio
            if w > h:
                new_w = 20
                new_h = int(20 * (h / w))
                if new_h < 1: new_h = 1
                resized_digit = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)
            else:
                new_h = 20
                new_w = int(20 * (w / h))
                if new_w < 1: new_w = 1
                resized_digit = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)

            # Create a blank 28x28 background
            mnist_img = np.zeros((28, 28), dtype=np.uint8)
            
            # Calculate center of mass for perfect MNIST alignment
            M = cv2.moments(resized_digit)
            if M["m00"] > 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
            else:
                cx = resized_digit.shape[1] // 2
                cy = resized_digit.shape[0] // 2

            # Place the resized digit centered on (14, 14)
            dx = 14 - cx
            dy = 14 - cy
            
            dx = max(0, min(28 - resized_digit.shape[1], dx))
            dy = max(0, min(28 - resized_digit.shape[0], dy))

            mnist_img[dy:dy+resized_digit.shape[0], dx:dx+resized_digit.shape[1]] = resized_digit
        else:
            # Fallback if no contours found
            mnist_img = cv2.resize(thresh, (28, 28), interpolation=cv2.INTER_AREA)

        # Normalize to [0, 1]
        normalized = mnist_img.astype("float32") / 255.0
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
        # Direct function call model(input, training=False) is up to 50x faster than model.predict(input) for single inputs
        predictions = model(input_data, training=False).numpy()[0]
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
