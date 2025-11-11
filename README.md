# Web Attack Detection Project

## Project Description

This project is a web application designed to analyze network logs and detect potential attacks using pre-trained machine learning models. The **Flask backend** loads and executes the ML models, while the **React frontend** allows users to submit network log entries and view the results. The system is intended for logs captured by tools such as FlowMeter or Zeek, enabling easy testing and evaluation of network activity.

---

## Tech Stack

- **Backend:** Python, Flask
- **Frontend:** React, JavaScript, HTML/CSS
- **Machine Learning:** scikit-learn, pandas, numpy
- **Input Data:** CSV files containing network flow features

---

## How to Run the Project

### 1. Run the Backend

- Navigate to the project root folder.
- Execute the backend Python script:

```bash
python try.py

```

### 2. Run the Frontend

Open a new terminal and navigate to the web folder:

```bash
cd web
```

Install dependencies:

```bash
npm install
```

Start the React frontend:

```bash
npm run dev
```

### 3. Input File Requirements

The backend expects a CSV file as input, e.g., test_input.csv.
The CSV must include the following features (columns) in order:
flow_duration, fwd_pkts_tot, bwd_pkts_tot, fwd_data_pkts_tot, bwd_data_pkts_tot,
fwd_pkts_per_sec, bwd_pkts_per_sec, flow_pkts_per_sec, down_up_ratio,
fwd_header_size_tot, fwd_header_size_min, fwd_header_size_max,
bwd_header_size_tot, bwd_header_size_min, bwd_header_size_max,
flow_FIN_flag_count, flow_SYN_flag_count, flow_RST_flag_count,
fwd_PSH_flag_count, bwd_PSH_flag_count, flow_ACK_flag_count,
payload_bytes_per_second, fwd_init_window_size, bwd_init_window_size,
fwd_last_window_size, bwd_last_window_size, label

The backend processes the CSV using the trained models and returns predictions to the frontend indicating possible attacks.

### 4. Usage

- Start backend (python try.py)
- Start frontend (npm run dev)
- Upload or provide a CSV file with network logs.
- View predictions on the frontend, which indicate potential attacks.

### 5. Note

- The project is intended for educational/research purposes in network security and machine learning.
- Make sure Python dependencies (Flask, pandas, scikit-learn, etc.) and Node.js dependencies are installed before running the project.
