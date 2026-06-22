import numpy as np
import tensorflow as tf
import cv2
import base64


def get_gradcam_heatmap(model: tf.keras.Model, img_array: np.ndarray, last_conv_layer_name: str = None) -> np.ndarray:
    """
    Generate Grad-CAM heatmap for a given input image and model.
    Uses GradientTape directly on the model call to avoid issues with
    model.inputs on Sequential models built with input_shape.
    """
    # If last conv layer name is not provided, find the last Conv2D layer in the model
    if last_conv_layer_name is None:
        for layer in reversed(model.layers):
            if isinstance(layer, tf.keras.layers.Conv2D):
                last_conv_layer_name = layer.name
                break

    if last_conv_layer_name is None:
        raise ValueError("No Conv2D layer found in the model.")

    # Build a sub-model from the conv layer output to the final output.
    # Use a fresh functional model built from layer calls to avoid Sequential .inputs issues.
    last_conv_layer = model.get_layer(last_conv_layer_name)

    img_tensor = tf.cast(np.expand_dims(img_array, axis=0), tf.float32)  # (1, 28, 28, 1)

    with tf.GradientTape() as tape:
        # Run the model layer-by-layer, watching the conv layer output
        x = img_tensor
        conv_output = None
        tape.watch(x)
        for layer in model.layers:
            x = layer(x)
            if layer.name == last_conv_layer_name:
                conv_output = x
                tape.watch(conv_output)

        preds = x  # final model output (after all layers)
        top_pred_index = tf.argmax(preds[0])
        top_class_channel = preds[:, top_pred_index]

    # Gradient of the top class score w.r.t. the conv output
    grads = tape.gradient(top_class_channel, conv_output)

    if grads is None:
        raise ValueError("Gradient computation returned None. Check model structure.")

    # Global average pooling of the gradients over spatial dims
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight feature maps by their importance
    conv_output_val = conv_output[0]
    heatmap = conv_output_val @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # Apply ReLU and normalize
    heatmap = tf.maximum(heatmap, 0)
    max_val = tf.math.reduce_max(heatmap)
    if max_val == 0:
        return np.zeros((heatmap.shape[0], heatmap.shape[1]), dtype=np.float32)
    heatmap = heatmap / max_val
    return heatmap.numpy()


def generate_gradcam_base64(model: tf.keras.Model, img_array: np.ndarray) -> str:
    """
    Compute Grad-CAM heatmap, superimpose it on the original image,
    and return as a base64 encoded string.
    """
    try:
        heatmap = get_gradcam_heatmap(model, img_array)

        # Resize heatmap to 28x28 (match original image shape)
        heatmap_resized = cv2.resize(heatmap, (28, 28))

        # Scale to 0-255
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        # Apply jet colormap to the heatmap
        jet_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # Prepare original image: convert (28, 28, 1) float [0, 1] -> (28, 28, 3) uint8 BGR
        orig_img = np.uint8(255 * img_array)
        if orig_img.ndim == 3 and orig_img.shape[2] == 1:
            orig_img = cv2.cvtColor(orig_img, cv2.COLOR_GRAY2BGR)
        elif orig_img.ndim == 2:
            orig_img = cv2.merge([orig_img, orig_img, orig_img])

        # Superimpose the heatmap on original image
        superimposed_img = jet_heatmap * 0.4 + orig_img * 0.6
        superimposed_img = np.clip(superimposed_img, 0, 255).astype(np.uint8)

        # Scale up for better display quality in UI
        superimposed_img = cv2.resize(superimposed_img, (140, 140), interpolation=cv2.INTER_NEAREST)

        # Encode to PNG base64
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
    Uses direct layer calls to avoid model.inputs issues with Sequential models.
    """
    conv_layers = [layer for layer in model.layers if isinstance(layer, tf.keras.layers.Conv2D)]
    if not conv_layers:
        return {}

    img_tensor = tf.cast(np.expand_dims(img_array, axis=0), tf.float32)  # (1, 28, 28, 1)

    # Run the model layer-by-layer, collecting conv outputs
    x = img_tensor
    conv_activations = {}
    for layer in model.layers:
        x = layer(x)
        if isinstance(layer, tf.keras.layers.Conv2D):
            conv_activations[layer.name] = x.numpy()

    result = {}
    for layer_name, activation in conv_activations.items():
        # activation shape: (1, height, width, num_filters)
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
                f_map = np.zeros_like(f_map, dtype=np.uint8)

            # Resize filter map for visualization
            f_map_resized = cv2.resize(f_map, (56, 56), interpolation=cv2.INTER_NEAREST)
            _, buffer = cv2.imencode(".png", f_map_resized)
            b64 = base64.b64encode(buffer).decode("utf-8")
            filters.append(f"data:image/png;base64,{b64}")

        result[layer_name] = {
            "num_filters": num_filters,
            "filters": filters
        }

    return result
