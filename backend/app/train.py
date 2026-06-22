import tensorflow as tf
import os
import json
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Flatten, Conv2D, MaxPooling2D, Dropout
from tensorflow.keras.utils import to_categorical
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
import mlflow
import mlflow.keras
from backend.app.core.config import settings


def load_data():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    train_path = os.path.join(project_root, "mnist_train.csv")
    test_path = os.path.join(project_root, "mnist_test.csv")
    
    print(f"Loading training data from {train_path}...")
    df_train = pd.read_csv(train_path)
    print(f"Loading test data from {test_path}...")
    df_test = pd.read_csv(test_path)
    
    # Drop rows with NaN if any
    df_train.dropna(inplace=True)
    df_test.dropna(inplace=True)
    
    X_train = df_train.drop("label", axis=1).values
    y_train = df_train["label"].values
    X_test = df_test.drop("label", axis=1).values
    y_test = df_test["label"].values
    
    # Normalize pixel values
    X_train = X_train.astype("float32") / 255.0
    X_test = X_test.astype("float32") / 255.0
    
    # Reshape for different architectures
    # We will keep (N, 28, 28, 1) as the base representation
    X_train_img = X_train.reshape(-1, 28, 28, 1)
    X_test_img = X_test.reshape(-1, 28, 28, 1)
    
    # One-hot encode targets
    y_train_cat = to_categorical(y_train, 10)
    y_test_cat = to_categorical(y_test, 10)
    
    return X_train_img, y_train_cat, y_train, X_test_img, y_test_cat, y_test

def build_perceptron():
    model = Sequential([
        Flatten(input_shape=(28, 28, 1)),
        Dense(10, activation="softmax")
    ])
    model.compile(optimizer="sgd", loss="categorical_crossentropy", metrics=["accuracy"])
    return model

def build_ann():
    model = Sequential([
        Flatten(input_shape=(28, 28, 1)),
        Dense(128, activation="relu"),
        Dense(64, activation="relu"),
        Dense(10, activation="softmax")
    ])
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    return model

def build_cnn():
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

def train_model(model_name, build_fn, X_train, y_train_cat, X_test, y_test_cat, y_test):
    print(f"\n--- Training {model_name} ---")
    model = build_fn()
    
    # Start MLflow run for this specific model
    with mlflow.start_run(run_name=model_name) as run:
        # Log parameters
        mlflow.log_param("epochs", 5)
        mlflow.log_param("batch_size", 32)
        mlflow.log_param("optimizer", model.optimizer.__class__.__name__)
        
        # Train
        history = model.fit(
            X_train, y_train_cat,
            epochs=5,
            batch_size=32,
            validation_data=(X_test, y_test_cat),
            verbose=1
        )
        
        # Log history metrics per epoch
        for epoch in range(5):
            mlflow.log_metric("train_loss", history.history["loss"][epoch], step=epoch)
            mlflow.log_metric("train_accuracy", history.history["accuracy"][epoch], step=epoch)
            mlflow.log_metric("val_loss", history.history["val_loss"][epoch], step=epoch)
            mlflow.log_metric("val_accuracy", history.history["val_accuracy"][epoch], step=epoch)
            
        # Evaluate
        val_loss, val_acc = model.evaluate(X_test, y_test_cat, verbose=0)
        print(f"{model_name} Final Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
        mlflow.log_metric("final_val_loss", val_loss)
        mlflow.log_metric("final_val_accuracy", val_acc)
        
        # Detailed metrics: Precision, Recall, F1
        preds = model.predict(X_test, verbose=0)
        pred_labels = np.argmax(preds, axis=1)
        
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, pred_labels, average="macro")
        mlflow.log_metric("precision_macro", precision)
        mlflow.log_metric("recall_macro", recall)
        mlflow.log_metric("f1_macro", f1)
        
        # Confusion matrix
        cm = confusion_matrix(y_test, pred_labels)
        
        # Save model locally in settings.MODEL_DIR
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        model_save_path = os.path.join(settings.MODEL_DIR, f"{model_name.lower()}.keras")
        model.save(model_save_path)
        print(f"Saved model locally to {model_save_path}")
        
        # Log model artifact to MLflow
        mlflow.keras.log_model(model, artifact_path=f"model_{model_name.lower()}")
        
        # Return metrics for comparisons
        return {
            "name": model_name,
            "accuracy": float(val_acc),
            "loss": float(val_loss),
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "history": {
                "loss": [float(x) for x in history.history["loss"]],
                "accuracy": [float(x) for x in history.history["accuracy"]],
                "val_loss": [float(x) for x in history.history["val_loss"]],
                "val_accuracy": [float(x) for x in history.history["val_accuracy"]]
            },
            "confusion_matrix": cm.tolist()
        }

def main():
    # Setup MLflow configuration
    mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
    mlflow.set_experiment(settings.MLFLOW_EXPERIMENT_NAME)
    
    X_train, y_train_cat, y_train, X_test, y_test_cat, y_test = load_data()
    
    results = {}
    
    # Train all 3 models
    perceptron_metrics = train_model("Perceptron", build_perceptron, X_train, y_train_cat, X_test, y_test_cat, y_test)
    ann_metrics = train_model("ANN", build_ann, X_train, y_train_cat, X_test, y_test_cat, y_test)
    cnn_metrics = train_model("CNN", build_cnn, X_train, y_train_cat, X_test, y_test_cat, y_test)
    
    results["perceptron"] = perceptron_metrics
    results["ann"] = ann_metrics
    results["cnn"] = cnn_metrics
    
    # Save a run metadata JSON file locally for dashboard use
    metadata_path = os.path.join(settings.MODEL_DIR, "metrics.json")
    with open(metadata_path, "w") as f:
        json.dump(results, f, indent=4)
        
    print(f"\nAll models trained and local metadata saved to {metadata_path}")

if __name__ == "__main__":
    main()
