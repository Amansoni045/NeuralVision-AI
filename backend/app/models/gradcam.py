import numpy as np
import tensorflow as tf
import cv2
import base64

def get_gradcam_heatmap(model: tf.keras.Model, img_array: np.ndarray, last_conv_layer_name: str = None) -> np.ndarray:
    """
    Generate Grad-CAM heatmap for a given input image and model.
    """
    # If last conv layer name is not provided, find the last Conv2D layer in the model
    if last_conv_layer_name is None:
        for layer in reversed(model.layers):
            if isinstance(layer, tf.keras.layers.Conv2D):
                last_conv_layer_name = layer.name
                break
    
    if last_conv_layer_name is None:
        raise ValueError("No Conv2D layer found in the model.")

    # Create a model that maps the input image to the activations of the last conv layer
    # as well as the output predictions
    grad_model = tf.keras.models.Model(
        inputs=model.inputs,
        outputs=[model.get_layer(last_conv_layer_name).output, model.output]
    )

    img_tensor = np.expand_dims(img_array, axis=0) # Add batch dimension -> (1, 28, 28, 1)

    # Compute the gradient of the top predicted class for the input image
    # with respect to the activations of the last conv layer
    with tf.GradientTape() as tape:
        last_conv_layer_output, preds = grad_model(img_tensor)
        top_pred_index = tf.argmax(preds[0])
        top_class_channel = preds[:, top_pred_index]

    # Gradient of the top class with respect to the output feature map of the last conv layer
    grads = tape.gradient(top_class_channel, last_conv_layer_output)

    # Global average pooling of the gradients
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # We multiply each channel in the feature map array
    # by "how important this channel is" with regard to the top predicted class
    # then sum all the channels to obtain the heatmap class activation
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # Apply ReLU to retain only positive influence features, and normalize
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()

def generate_gradcam_base64(model: tf.keras.Model, img_array: np.ndarray) -> str:
    """
    Compute Grad-CAM heatmap, superimpose it on the original image, 
    and return as a base64 encoded string.
    """
    try:
        heatmap = get_gradcam_heatmap(model, img_array)
        
        # Resize heatmap to 28x28 (match original image shape)
        heatmap = cv2.resize(heatmap, (28, 28))
        
        # Scale to 0-255
        heatmap = np.uint8(255 * heatmap)
        
        # Apply jet colormap to the heatmap
        jet_heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        
        # Prepare original image: convert (28, 28, 1) float [0, 1] -> (28, 28, 3) uint8 BGR
        orig_img = np.uint8(255 * img_array)
        if len(orig_img.shape) == 3:
            orig_img = cv2.cvtColor(orig_img, cv2.COLOR_GRAY2BGR)
        else:
            orig_img = cv2.merge([orig_img, orig_img, orig_img])
            
        # Superimpose the heatmap on original image
        superimposed_img = jet_heatmap * 0.4 + orig_img * 0.6
        superimposed_img = np.clip(superimposed_img, 0, 255).astype(np.uint8)
        
        # Scale up for better display quality in UI (e.g. to 140x140 or 280x280)
        superimposed_img = cv2.resize(superimposed_img, (140, 140), interpolation=cv2.INTER_NEAREST)
        
        # Encode to JPEG base64
        _, buffer = cv2.imencode(".png", superimposed_img)
        base64_str = base64.b64encode(buffer).decode("utf-8")
        return f"data:image/png;base64,{base64_str}"
    except Exception as e:
        print(f"Error generating Grad-CAM: {e}")
        return ""

def get_activation_maps(model: tf.keras.Model, img_array: np.ndarray):
    """
    Extract activation maps from the convolutional layers of the CNN.
    Returns a dictionary mapping layer names to their corresponding activation feature maps.
    """
    conv_layers = [layer for layer in model.layers if isinstance(layer, tf.keras.layers.Conv2D)]
    if not conv_layers:
        return {}

    layer_outputs = [layer.output for layer in conv_layers]
    activation_model = tf.keras.models.Model(inputs=model.inputs, outputs=layer_outputs)
    
    img_tensor = np.expand_dims(img_array, axis=0) # Shape: (1, 28, 28, 1)
    activations = activation_model.predict(img_tensor, verbose=0)
    
    # If there is only one conv layer, activations might not be returned as a list
    if not isinstance(activations, list):
        activations = [activations]
        
    result = {}
    for layer, activation in zip(conv_layers, activations):
        # Activation shape: (1, height, width, num_filters)
        # Convert each filter map to base64 for easy UI viewing
        filters = []
        num_filters = activation.shape[-1]
        for i in range(num_filters):
            f_map = activation[0, :, :, i]
            # Normalize to 0-255
            f_max = np.max(f_map)
            f_min = np.min(f_map)
            if f_max > f_min:
                f_map = np.uint8(255 * (f_map - f_min) / (f_max - f_min))
            else:
                f_map = np.uint8(f_map * 0)
                
            # Resize filter map for visualization (e.g. to 56x56)
            f_map_resized = cv2.resize(f_map, (56, 56), interpolation=cv2.INTER_NEAREST)
            _, buffer = cv2.imencode(".png", f_map_resized)
            b64 = base64.b64encode(buffer).decode("utf-8")
            filters.append(f"data:image/png;base64,{b64}")
            
        result[layer.name] = {
            "num_filters": num_filters,
            "filters": filters
        }
        
    return result
