from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")
    battle_logs = relationship("BattleArenaLog", back_populates="user", cascade="all, delete-orphan")

class PredictionHistory(Base):
    __tablename__ = "prediction_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    image_data = Column(Text, nullable=False) # Store original drawn/uploaded image as base64
    model_type = Column(String(50), nullable=False) # "perceptron", "ann", "cnn"
    predicted_label = Column(Integer, nullable=False)
    actual_label = Column(Integer, nullable=True) # If corrected by user
    confidence = Column(Float, nullable=False)
    all_confidences = Column(JSON, nullable=False) # List of 10 confidences (float)
    inference_time_ms = Column(Float, nullable=False)
    source = Column(String(50), nullable=False) # "canvas", "upload", "webcam"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="predictions")

class BattleArenaLog(Base):
    __tablename__ = "battle_arena_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    image_data = Column(Text, nullable=False) # base64 image data
    actual_label = Column(Integer, nullable=True)
    
    # Perceptron results
    perceptron_predicted = Column(Integer, nullable=False)
    perceptron_confidence = Column(Float, nullable=False)
    perceptron_latency_ms = Column(Float, nullable=False)
    
    # ANN results
    ann_predicted = Column(Integer, nullable=False)
    ann_confidence = Column(Float, nullable=False)
    ann_latency_ms = Column(Float, nullable=False)
    
    # CNN results
    cnn_predicted = Column(Integer, nullable=False)
    cnn_confidence = Column(Float, nullable=False)
    cnn_latency_ms = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="battle_logs")
