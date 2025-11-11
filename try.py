from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import traceback
from flask_cors import CORS
import os
import torch
import torch.nn as nn
import torch.nn.functional as F

# ========== Flask setup ==========
app = Flask(__name__)
CORS(app)


MODEL_PATH = "web_attack_model_pytorch.pth"
SCALER_PATH = "web_attack_scaler.pkl"
ENCODER_PATH = "web_attack_encoder.pkl"

# ========== Load scaler + encoder ==========
scaler = None
encoder = None
try:
    scaler = joblib.load(SCALER_PATH)
    print("✅ Loaded scaler.")
except Exception as e:
    print("⚠️ Failed to load scaler:", e)

try:
    encoder = joblib.load(ENCODER_PATH)
    print("✅ Loaded encoder.")
except Exception as e:
    print("⚠️ Failed to load encoder:", e)

# ========== Feature list ==========
DROP_COLUMNS = ['uid', 'ts', 'id.orig_h', 'id.resp_h', 'service', 'traffic_direction']

FEATURES = [
    "flow_duration", "fwd_pkts_tot", "bwd_pkts_tot",
    "fwd_data_pkts_tot", "bwd_data_pkts_tot",
    "fwd_pkts_per_sec", "bwd_pkts_per_sec", "flow_pkts_per_sec", "down_up_ratio",
    "fwd_header_size_tot", "fwd_header_size_min", "fwd_header_size_max",
    "bwd_header_size_tot", "bwd_header_size_min", "bwd_header_size_max",
    "flow_FIN_flag_count", "flow_SYN_flag_count", "flow_RST_flag_count",
    "fwd_PSH_flag_count", "bwd_PSH_flag_count", "flow_ACK_flag_count",
    "payload_bytes_per_second", "fwd_init_window_size", "bwd_init_window_size",
    "fwd_last_window_size", "bwd_last_window_size"
]

# ========== MLP class ==========
class MLP(nn.Module):
    def __init__(self, input_dim, hidden_dims=[32, 16], output_dim=2):
        super(MLP, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dims[0])
        self.fc2 = nn.Linear(hidden_dims[0], hidden_dims[1])
        self.fc3 = nn.Linear(hidden_dims[1], output_dim)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# ========== Load or construct PyTorch model ==========
device = torch.device("cpu")
pytorch_model = None

def try_load_pytorch_model(path):
    global pytorch_model
    if not os.path.exists(path):
        print(f"❌ Model file not found: {path}")
        pytorch_model = None
        return

    try:
        loaded = torch.load(path, map_location=device)
        print("🔹 torch.load returned type:", type(loaded))

        # Case 1: full module saved
        if isinstance(loaded, nn.Module):
            pytorch_model = loaded.to(device)
            pytorch_model.eval()
            print("✅ Loaded full nn.Module from file.")
            return

        # Case 2: dict -> state_dict
        if isinstance(loaded, dict):
            state = loaded
            input_dim = len(FEATURES)
            if encoder is not None and hasattr(encoder, "classes_"):
                output_dim = len(encoder.classes_)
            else:
                output_dim = 2

            model = MLP(input_dim=input_dim, hidden_dims=[32,16], output_dim=output_dim)
            try:
                model.load_state_dict(state)
                pytorch_model = model.to(device)
                pytorch_model.eval()
                print("✅ Loaded model state_dict successfully.")
                return
            except Exception as e:
                print("⚠️ Direct load failed:", e)
                raise

        raise RuntimeError("torch.load returned unexpected type.")
    except Exception as e:
        print("❌ Failed to load model:", e)
        pytorch_model = None

# Load model at startup
try_load_pytorch_model(MODEL_PATH)
print("🔸 PyTorch model loaded:", pytorch_model is not None)

# ========== Prediction helper ==========
def predict_with_pytorch(X_numpy):
    if pytorch_model is None:
        raise RuntimeError("PyTorch model is not loaded on server.")
    x = torch.tensor(X_numpy, dtype=torch.float32, device=device)
    pytorch_model.eval()
    with torch.no_grad():
        out = pytorch_model(x)
        out_np = out.cpu().numpy()
        if out_np.ndim == 1:
            sig = 1.0 / (1.0 + np.exp(-out_np))
            probs = np.vstack([1 - sig, sig]).T
        else:
            exp = np.exp(out_np - np.max(out_np, axis=1, keepdims=True))
            probs = exp / np.sum(exp, axis=1, keepdims=True)
        preds_idx = np.argmax(probs, axis=1)
        return preds_idx, probs

# ========== CSV Reader ==========
def read_csv_with_fallback(fileobj):
    encodings = ["utf-8", "utf-8-sig", "cp1252", "latin1", "utf-16"]
    for enc in encodings:
        try:
            fileobj.seek(0)
            df = pd.read_csv(fileobj, encoding=enc)
            print(f"✅ Read CSV with encoding {enc}")
            return df
        except Exception:
            continue
    fileobj.seek(0)
    return pd.read_csv(fileobj)

# ========== API: single predict ==========
# @app.route("/predict", methods=["POST"])
# def predict():
#     try:
#         payload = request.get_json()
#         if not payload:
#             return jsonify({"error": "No JSON payload received"}), 400
#
#         for c in DROP_COLUMNS:
#             payload.pop(c, None)
#
#         row = {}
#         for feat in FEATURES:
#             val = payload.get(feat, 0.0)
#             try:
#                 row[feat] = float(val)
#             except:
#                 row[feat] = 0.0
#
#         df = pd.DataFrame([row], columns=FEATURES)
#
#         if scaler is not None:
#             X = scaler.transform(df)
#         else:
#             X = df.values
#
#         preds_idx, probs = predict_with_pytorch(X)
#
#         if encoder is not None and hasattr(encoder, "inverse_transform"):
#             labels = encoder.inverse_transform(preds_idx)
#         else:
#             labels = [str(int(i)) for i in preds_idx]
#
#         if probs is not None:
#             class_labels = list(getattr(encoder, "classes_", [str(i) for i in range(probs.shape[1])]))
#             prob_dict = {class_labels[j]: float(probs[0, j]) for j in range(probs.shape[1])}
#             top_prob = float(np.max(probs[0]))
#         else:
#             prob_dict = {}
#             top_prob = None
#
#         return jsonify({"prediction": labels[0], "probabilities": prob_dict, "top_probability": top_prob})
#
#     except Exception as e:
#         return jsonify({"error": "Unexpected server error", "details": str(e), "trace": traceback.format_exc()}), 500

# ========== API: CSV batch predict ==========
@app.route("/predict_csv", methods=["POST"])
def predict_csv():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No CSV file uploaded"}), 400
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        # Đọc file CSV
        # df = read_csv_with_fallback(file)
        # df = df.drop(columns=[c for c in DROP_COLUMNS if c in df.columns], errors="ignore")
        # df = df.fillna(0)
        # df = df[[c for c in FEATURES if c in df.columns]]
        df = read_csv_with_fallback(file)
        df = df.drop(columns=[c for c in DROP_COLUMNS if c in df.columns], errors="ignore")

        # === Kiểm tra cột thiếu ===
        missing_cols = [c for c in FEATURES if c not in df.columns]
        if missing_cols:
            return jsonify({
                "error": "Thiếu các cột cần thiết trong file CSV.",
                "missing_columns": missing_cols,
                "details": f"File CSV đang thiếu {len(missing_cols)} cột: {', '.join(missing_cols)}"
            }), 400

        # Nếu đủ cột thì fillna và lấy đúng thứ tự
        df = df.fillna(0)
        df = df[FEATURES]

        # Chuẩn hóa dữ liệu
        if scaler is not None:
            X = scaler.transform(df)
        else:
            X = df.values

        # Dự đoán
        preds_idx, probs = predict_with_pytorch(X)

        if encoder is not None and hasattr(encoder, "inverse_transform"):
            labels = encoder.inverse_transform(preds_idx)
        else:
            labels = [str(int(i)) for i in preds_idx]

        class_labels = list(getattr(encoder, "classes_", [str(i) for i in range(probs.shape[1])]))

        # Gộp kết quả từng dòng
        results = []
        for i in range(len(labels)):
            prob_dict = {class_labels[j]: float(probs[i, j]) for j in range(probs.shape[1])}
            results.append({
                "label": labels[i],
                "prob": float(np.max(probs[i])),
                "probabilities": prob_dict
            })

        # === TÍNH TỔNG TỈ LỆ PHẦN TRĂM MỖI LOẠI ===
        label_counts = {}
        total = len(labels)
        for lbl in labels:
            label_counts[lbl] = label_counts.get(lbl, 0) + 1
        label_percentages = {lbl: round((count / total) * 100, 2) for lbl, count in label_counts.items()}

        # Trả về kết quả
        return jsonify({
            "predictions": results,
            "summary": label_percentages
        })

    except Exception as e:
        return jsonify({
            "error": "Error processing CSV file",
            "details": str(e),
            "trace": traceback.format_exc()
        }), 500

# ========== Run ==========
if __name__ == "__main__":
    print("Starting Flask server. PyTorch model loaded:", pytorch_model is not None)
    app.run(host="0.0.0.0", port=5000, debug=True)
