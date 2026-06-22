from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class PredictRequest(BaseModel):
    image_data: str # Base64 data URI
    source: str # "canvas", "upload", "webcam"
    model_type: str = "cnn" # "perceptron", "ann", "cnn"
    explain: bool = True


class ModelPredictionDetail(BaseModel):
    predicted_class: int
    confidence: float
    all_confidences: List[float]
    latency_ms: float

class PredictResponse(BaseModel):
    predicted_class: int
    confidence: float
    all_confidences: List[float]
    latency_ms: float
    gradcam_image: Optional[str] = None
    activation_maps: Optional[Dict[str, Any]] = None
    preprocessed_image: Optional[str] = None
    prediction_id: Optional[int] = None # DB row ID to allow correction later

class BattleArenaResponse(BaseModel):
    perceptron: ModelPredictionDetail
    ann: ModelPredictionDetail
    cnn: ModelPredictionDetail
    gradcam_image: Optional[str] = None
    activation_maps: Optional[Dict[str, Any]] = None
    log_id: Optional[int] = None

class CorrectRequest(BaseModel):
    prediction_id: int
    actual_label: int
    is_battle_arena: bool = False
