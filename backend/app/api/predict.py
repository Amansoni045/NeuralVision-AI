import base64
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from typing import Optional
from sqlalchemy.orm import Session
import numpy as np
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from backend.app.core.database import get_db, SessionLocal
from backend.app.core.security import ALGORITHM
from backend.app.core.config import settings
from backend.app.db.models import User, PredictionHistory, BattleArenaLog
from backend.app.models.prediction_service import prediction_service
from backend.app.models.gradcam import generate_gradcam_base64, get_activation_maps
from backend.app.schemas.predict import PredictRequest, PredictResponse, BattleArenaResponse

router = APIRouter(prefix="/predict", tags=["prediction"])

# OAuth2 scheme with auto_error=False, so requests without token do not crash with 401
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-form", auto_error=False)

def get_optional_user(db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme_optional)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = db.query(User).filter(User.email == email).first()
        return user
    except JWTError:
        return None

def log_battle_in_background(
    user_id: Optional[int],
    image_data: str,
    perceptron_predicted: int,
    perceptron_confidence: float,
    perceptron_latency_ms: float,
    ann_predicted: int,
    ann_confidence: float,
    ann_latency_ms: float,
    cnn_predicted: int,
    cnn_confidence: float,
    cnn_latency_ms: float
):
    db = SessionLocal()
    try:
        db_log = BattleArenaLog(
            user_id=user_id,
            image_data=image_data,
            perceptron_predicted=perceptron_predicted,
            perceptron_confidence=perceptron_confidence,
            perceptron_latency_ms=perceptron_latency_ms,
            ann_predicted=ann_predicted,
            ann_confidence=ann_confidence,
            ann_latency_ms=ann_latency_ms,
            cnn_predicted=cnn_predicted,
            cnn_confidence=cnn_confidence,
            cnn_latency_ms=cnn_latency_ms
        )
        db.add(db_log)
        db.commit()
    except Exception as e:
        print(f"Background battle log failed: {e}")
    finally:
        db.close()

@router.post("", response_model=PredictResponse)
def predict_digit(
    payload: PredictRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # Preprocess image
    preprocessed_img = prediction_service.preprocess_image(payload.image_data)
    
    # Run prediction
    res = prediction_service.predict(payload.model_type, preprocessed_img)
    
    # Generate preprocessed preview base64
    import cv2
    img_uint8 = (preprocessed_img.squeeze() * 255).astype(np.uint8)
    _, encoded_img = cv2.imencode(".png", img_uint8)
    preprocessed_base64 = base64.b64encode(encoded_img).decode("utf-8")
    preprocessed_uri = f"data:image/png;base64,{preprocessed_base64}"

    # Generate Grad-CAM and activations only for CNN model if requested
    gradcam_img = None
    activation_maps = None
    if payload.explain and payload.model_type == "cnn" and prediction_service.cnn is not None:
        gradcam_img = generate_gradcam_base64(prediction_service.cnn, preprocessed_img)
        activation_maps = get_activation_maps(prediction_service.cnn, preprocessed_img)
        
    # Save to history in DB (only for final predictions: uploads or canvas with explain=True)
    db_history = None
    should_log = (payload.source == "upload") or (payload.source == "canvas" and payload.explain) or (payload.source == "webcam" and payload.explain)
    
    if should_log:
        try:
            db_history = PredictionHistory(
                user_id=current_user.id if current_user else None,
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
        "preprocessed_image": preprocessed_uri,
        "prediction_id": prediction_id
    }

@router.post("/canvas", response_model=PredictResponse)
def predict_canvas(
    payload: PredictRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # Specialized endpoint for canvas
    payload.source = "canvas"
    return predict_digit(payload, db, current_user)

@router.post("/image", response_model=PredictResponse)
def predict_image(
    file: UploadFile = File(...),
    model_type: str = Form("cnn"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
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
    return predict_digit(payload, db, current_user)

@router.post("/battle", response_model=BattleArenaResponse)
def predict_battle(
    payload: PredictRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # Preprocess image
    preprocessed_img = prediction_service.preprocess_image(payload.image_data)
    
    # Run predictions on all three models
    percep_res = prediction_service.predict("perceptron", preprocessed_img)
    ann_res = prediction_service.predict("ann", preprocessed_img)
    cnn_res = prediction_service.predict("cnn", preprocessed_img)
    
    # Generate Grad-CAM and activations for CNN if requested
    gradcam_img = None
    activation_maps = None
    if payload.explain and prediction_service.cnn is not None:
        gradcam_img = generate_gradcam_base64(prediction_service.cnn, preprocessed_img)
        activation_maps = get_activation_maps(prediction_service.cnn, preprocessed_img)
        
    # Log to BattleArenaLogs table in background
    background_tasks.add_task(
        log_battle_in_background,
        current_user.id if current_user else None,
        payload.image_data,
        percep_res["predicted_class"],
        percep_res["confidence"],
        percep_res["latency_ms"],
        ann_res["predicted_class"],
        ann_res["confidence"],
        ann_res["latency_ms"],
        cnn_res["predicted_class"],
        cnn_res["confidence"],
        cnn_res["latency_ms"]
    )

    return {
        "perceptron": percep_res,
        "ann": ann_res,
        "cnn": cnn_res,
        "gradcam_image": gradcam_img,
        "activation_maps": activation_maps,
        "log_id": 0
    }
