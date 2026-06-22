import base64
from fastapi import APIRouter, Depends, UploadFile, File, Form, Optional
from sqlalchemy.orm import Session
import numpy as np

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.db.models import User, PredictionHistory, BattleArenaLog
from backend.app.models.prediction_service import prediction_service
from backend.app.models.gradcam import generate_gradcam_base64, get_activation_maps
from backend.app.schemas.predict import PredictRequest, PredictResponse, BattleArenaResponse

router = APIRouter(prefix="/predict", tags=["prediction"])

def get_optional_user(db: Session = Depends(get_db), current_user_or_none = Depends(get_current_user)) -> Optional[User]:
    # Custom helper to return current user if authenticated, else None
    return current_user_or_none

@router.post("", response_model=PredictResponse)
def predict_digit(
    payload: PredictRequest,
    db: Session = Depends(get_db)
):
    # Preprocess image
    preprocessed_img = prediction_service.preprocess_image(payload.image_data)
    
    # Run prediction
    res = prediction_service.predict(payload.model_type, preprocessed_img)
    
    # Generate Grad-CAM and activations only for CNN model
    gradcam_img = None
    activation_maps = None
    if payload.model_type == "cnn" and prediction_service.cnn is not None:
        gradcam_img = generate_gradcam_base64(prediction_service.cnn, preprocessed_img)
        activation_maps = get_activation_maps(prediction_service.cnn, preprocessed_img)
        
    # Save to history in DB
    db_history = None
    try:
        db_history = PredictionHistory(
            image_data=payload.image_data,
            model_type=payload.model_type,
            predicted_label=res["predicted_class"],
            confidence=res["confidence"],
            all_confidences=res["all_confidences"],
            inference_time_ms=res["latency_ms"],
            source=payload.source
        )
        db.add(db_history)
        db.commit()
        db.refresh(db_history)
    except Exception as e:
        print(f"Database save error (prediction logging bypassed): {e}")
        
    prediction_id = db_history.id if db_history else None

    return {
        "predicted_class": res["predicted_class"],
        "confidence": res["confidence"],
        "all_confidences": res["all_confidences"],
        "latency_ms": res["latency_ms"],
        "gradcam_image": gradcam_img,
        "activation_maps": activation_maps,
        "prediction_id": prediction_id
    }

@router.post("/canvas", response_model=PredictResponse)
def predict_canvas(
    payload: PredictRequest,
    db: Session = Depends(get_db)
):
    # Specialized endpoint for canvas
    payload.source = "canvas"
    return predict_digit(payload, db)

@router.post("/image", response_model=PredictResponse)
def predict_image(
    file: UploadFile = File(...),
    model_type: str = Form("cnn"),
    db: Session = Depends(get_db)
):
    # Read uploaded file
    file_bytes = file.file.read()
    base64_data = base64.b64encode(file_bytes).decode("utf-8")
    data_uri = f"data:{file.content_type};base64,{base64_data}"
    
    payload = PredictRequest(
        image_data=data_uri,
        source="upload",
        model_type=model_type
    )
    return predict_digit(payload, db)

@router.post("/battle", response_model=BattleArenaResponse)
def predict_battle(
    payload: PredictRequest,
    db: Session = Depends(get_db)
):
    # Preprocess image
    preprocessed_img = prediction_service.preprocess_image(payload.image_data)
    
    # Run predictions on all three models
    percep_res = prediction_service.predict("perceptron", preprocessed_img)
    ann_res = prediction_service.predict("ann", preprocessed_img)
    cnn_res = prediction_service.predict("cnn", preprocessed_img)
    
    # Generate Grad-CAM and activations for CNN
    gradcam_img = None
    activation_maps = None
    if prediction_service.cnn is not None:
        gradcam_img = generate_gradcam_base64(prediction_service.cnn, preprocessed_img)
        activation_maps = get_activation_maps(prediction_service.cnn, preprocessed_img)
        
    # Log to BattleArenaLogs table
    db_log = None
    try:
        db_log = BattleArenaLog(
            image_data=payload.image_data,
            perceptron_predicted=percep_res["predicted_class"],
            perceptron_confidence=percep_res["confidence"],
            perceptron_latency_ms=percep_res["latency_ms"],
            ann_predicted=ann_res["predicted_class"],
            ann_confidence=ann_res["confidence"],
            ann_latency_ms=ann_res["latency_ms"],
            cnn_predicted=cnn_res["predicted_class"],
            cnn_confidence=cnn_res["confidence"],
            cnn_latency_ms=cnn_res["latency_ms"]
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
    except Exception as e:
        print(f"Database save error (battle logging bypassed): {e}")

    log_id = db_log.id if db_log else None

    return {
        "perceptron": percep_res,
        "ann": ann_res,
        "cnn": cnn_res,
        "gradcam_image": gradcam_img,
        "activation_maps": activation_maps,
        "log_id": log_id
    }
