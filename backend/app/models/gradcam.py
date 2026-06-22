import numpy as np
import tensorflow as tf
import cv2
import base64


def get_gradcam_heatmap(model: tf.keras.Model, img_array: np.ndarray, last_conv_layer_name: str = None) -> np.ndarray:
    """
    Generate Grad-CAM heatmap for a given input image and model.

    Uses a two-pass strategy:
    1. Forward pass layer-by-layer to capture the conv layer's output as a tf.Variable.
    2. Second forward pass from the conv variable through remaining layers inside
       GradientTape so gradients w.r.t. the conv output are available.
    """
    # Find the last Conv2D layer if not specified
    if last_conv_layer_name is None:
        for layer in reversed(model.layers):
            if isinstance(layer, tf.keras.layers.Conv2D):
                last_conv_layer_name = layer.name
                break

    if last_conv_layer_name is None:
        raise ValueError("No Conv2D layer found in the model.")

    img_tensor = tf.cast(np.expand_dims(img_array, axis=0), tf.float32)  # (1, 28, 28, 1)

    # --- Pass 1: Run model up to (and including) the target conv layer ---
    x = img_tensor
    found_conv = False
    for layer in model.layers:
        x = layer(x)
        if layer.name == last_conv_layer_name:
            found_conv = True
            break

    if not found_conv:
        raise ValueError(f"Layer '{last_conv_layer_name}' not found in model.")

    # Store conv output as a tf.Variable so GradientTape auto-watches it
    conv_output_var = tf.Variable(x, trainable=True, dtype=tf.float32)

    # --- Pass 2: Run remaining layers inside GradientTape ---
    # Find layers AFTER the target conv layer
    layers_after_conv = []
    conv_seen = False
    for layer in model.layers:
        if conv_seen:
            layers_after_conv.append(layer)
        if layer.name == last_conv_layer_name:
            conv_seen = True

    with tf.GradientTape() as tape:
        x = conv_output_var
        for layer in layers_after_conv:
            x = layer(x)
        preds = x  # final softmax output (1, 10)

        # Use reduce_max to get the top class score (differentiable, unlike argmax)
        top_class_score = tf.reduce_max(preds, axis=1)

    # Gradient of top class score w.r.t. the conv output variable
    grads = tape.gradient(top_class_score, conv_output_var)

    if grads is None:
        raise ValueError("GradientTape returned None gradients. Check model structure.")

    # Global average pool the gradients over spatial dims -> (num_filters,)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight conv feature maps by their importance
    conv_vals = conv_output_var.numpy()[0]          # (h, w, num_filters)
    pooled_vals = pooled_grads.numpy()              # (num_filters,)

    # Weighted sum of feature maps
    heatmap = np.dot(conv_vals, pooled_vals)        # (h, w)

    # ReLU + normalize
    heatmap = np.maximum(heatmap, 0)
    max_val = np.max(heatmap)
    if max_val == 0:
        return np.zeros_like(heatmap, dtype=np.float32)
    heatmap = heatmap / max_val
    return heatmap.astype(np.float32)


def generate_gradcam_base64(model: tf.keras.Model, img_array: np.ndarray) -> str:
    """
    Compute Grad-CAM heatmap, superimpose it on the original image,
    and return as a base64-encoded PNG string.
    """
    try:
        heatmap = get_gradcam_heatmap(model, img_array)

        # Resize heatmap to 28x28
        heatmap_resized = cv2.resize(heatmap, (28, 28))

        # Scale to 0-255
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        # Apply JET colormap
        jet_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # Convert original image (28, 28, 1) float -> (28, 28, 3) uint8 BGR
        orig_img = np.uint8(255 * img_array)
        if orig_img.ndim == 3 and orig_img.shape[2] == 1:
            orig_img = cv2.cvtColor(orig_img, cv2.COLOR_GRAY2BGR)
        elif orig_img.ndim == 2:
            orig_img = cv2.merge([orig_img, orig_img, orig_img])

        # Superimpose heatmap on original
        superimposed = jet_heatmap * 0.4 + orig_img * 0.6
        superimposed = np.clip(superimposed, 0, 255).astype(np.uint8)

        # Scale up for display
        superimposed = cv2.resize(superimposed, (140, 140), interpolation=cv2.INTER_NEAREST)

        _, buffer = cv2.imencode(".png", superimposed)
        b64 = base64.b64encode(buffer).decode("utf-8")
        return f"data:image/png;base64,{b64}"
    except Exception as e:
        print(f"Grad-CAM error: {e}")
        return ""


def get_activation_maps(model: tf.keras.Model, img_array: np.ndarray):
    """
    Extract activation maps from all Conv2D layers by running layer-by-layer.
    Returns dict: layer_name -> {num_filters, filters: [base64_png, ...]}
    """
    img_tensor = tf.cast(np.expand_dims(img_array, axis=0), tf.float32)

    result = {}
    x = img_tensor
    for layer in model.layers:
        x = layer(x)
        if isinstance(layer, tf.keras.layers.Conv2D):
            activation = x.numpy()  # (1, h, w, num_filters)
            num_filters = activation.shape[-1]
            filters = []
            for i in range(num_filters):
                f_map = activation[0, :, :, i]
                f_max, f_min = np.max(f_map), np.min(f_map)
                if f_max > f_min:
                    f_map = np.uint8(255 * (f_map - f_min) / (f_max - f_min))
                else:
                    f_map = np.zeros_like(f_map, dtype=np.uint8)
                f_map_resized = cv2.resize(f_map, (56, 56), interpolation=cv2.INTER_NEAREST)
                _, buf = cv2.imencode(".png", f_map_resized)
                filters.append(f"data:image/png;base64,{base64.b64encode(buf).decode()}")
            result[layer.name] = {"num_filters": num_filters, "filters": filters}

    return result
