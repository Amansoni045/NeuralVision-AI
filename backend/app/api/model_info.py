from fastapi import APIRouter
from backend.app.models.prediction_service import prediction_service

router = APIRouter(prefix="/model-info", tags=["model-info"])

@router.get("")
def get_model_info():
    info = {}
    
    # Check if models are initialized
    models = {
        "perceptron": prediction_service.perceptron,
        "ann": prediction_service.ann,
        "cnn": prediction_service.cnn
    }
    
    for name, model in models.items():
        if model is not None:
            # Count parameters
            trainable_params = sum([v.numpy().size for v in model.trainable_variables])
            non_trainable_params = sum([v.numpy().size for v in model.non_trainable_variables])
            total_params = trainable_params + non_trainable_params
            
            # Extract layers details
            layers = []
            for layer in model.layers:
                layer_config = layer.get_config()
                try:
                    output_shape = layer.output_shape
                except AttributeError:
                    output_shape = None
                
                layers.append({
                    "name": layer.name,
                    "class_name": layer.__class__.__name__,
                    "output_shape": output_shape,
                    "trainable": layer.trainable,
                    "config": {k: v for k, v in layer_config.items() if isinstance(v, (int, float, str, bool, list, dict))}
                })
                
            info[name] = {
                "name": name.upper(),
                "status": prediction_service.model_status.get(name, {}).get("status", "loaded"),
                "error": prediction_service.model_status.get(name, {}).get("error", None),
                "total_parameters": total_params,
                "trainable_parameters": trainable_params,
                "non_trainable_parameters": non_trainable_params,
                "optimizer": model.optimizer.__class__.__name__ if model.optimizer else "unknown",
                "loss": model.loss if isinstance(model.loss, str) else getattr(model.loss, "name", "custom"),
                "layers": layers
            }
        else:
            info[name] = {
                "name": name.upper(),
                "status": "not_loaded"
            }
            
    return info
