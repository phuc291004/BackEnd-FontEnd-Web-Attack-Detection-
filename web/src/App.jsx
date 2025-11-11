// import React, { useState } from "react";
// import axios from "axios";
// import "./App.css";

// export default function LogTester() {
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [predictions, setPredictions] = useState(null);
//   const [error, setError] = useState(null);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//     setError(null);
//     setPredictions(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!file) {
//       setError("⚠️ Vui lòng chọn file CSV trước khi Test.");
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     setPredictions(null);

//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const res = await axios.post(
//         "http://127.0.0.1:5000/predict_csv",
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//           timeout: 60000,
//         }
//       );

//       const data = res.data;
//       if (Array.isArray(data.predictions)) {
//         setPredictions(data.predictions);
//       } else {
//         setError("Không nhận được predictions hợp lệ từ backend.");
//       }
//     } catch (err) {
//       console.error(err);
//       setError(
//         err.response?.data?.details || err.response?.data || err.message
//       );
//     } finally {
//       setLoading(false);
//       setFile(null);
//       const fileInput = document.querySelector('input[type="file"]');
//       if (fileInput) fileInput.value = "";
//     }
//   };

//   const styles = {
//     container: {
//       maxWidth: 950,
//       margin: "20px auto",
//       fontFamily: "Arial, Helvetica, sans-serif",
//     },
//     header: { marginBottom: 12 },
//     fileInfo: { fontSize: 13, color: "#333", marginTop: 8 },
//     barRow: {
//       display: "flex",
//       alignItems: "center",
//       gap: 12,
//       marginBottom: 10,
//     },
//     labelBox: { width: 220, textAlign: "left", fontWeight: 600 },
//     barWrap: {
//       flex: 1,
//       background: "#eee",
//       borderRadius: 8,
//       overflow: "hidden",
//       height: 22,
//     },
//     fill: (pct, color) => ({
//       width: `${pct}%`,
//       height: "100%",
//       background: color,
//     }),
//     percentCol: { width: 120, textAlign: "right", fontWeight: 700 },
//     topBadge: {
//       marginLeft: 8,
//       background: "#ffd700",
//       color: "#000",
//       padding: "2px 6px",
//       borderRadius: 6,
//       fontSize: 12,
//     },
//   };

//   const palette = [
//     "#2f80ed",
//     "#00b894",
//     "#ffb86b",
//     "#ff6b6b",
//     "#9b59b6",
//     "#00cec9",
//     "#f78fb3",
//     "#a29bfe",
//   ];

//   // ==== Utility tính % hiển thị (đã chuẩn hóa 100%) ====
//   const prepareDisplayPercents = (entries) => {
//     if (!entries || entries.length === 0) return [];

//     const parsed = entries
//       .map(([label, raw]) => {
//         const n = parseFloat(raw);
//         return [label, Number.isFinite(n) ? n : 0];
//       })
//       .filter(([_, v]) => v > 0);

//     if (parsed.length === 0) return [];

//     const totalRaw = parsed.reduce((s, [, v]) => s + v, 0);
//     if (totalRaw <= 0) return [];

//     const exact = parsed.map(([label, v]) => ({
//       label,
//       exact: (v / totalRaw) * 100,
//     }));

//     const rounded = exact.map((it) => ({
//       label: it.label,
//       exact: it.exact,
//       pct: Math.round(it.exact * 100) / 100,
//     }));

//     // phân phối phần dư để tổng = 100
//     let sumRounded = rounded.reduce((s, it) => s + it.pct, 0);
//     const diff = Math.round((100 - sumRounded) * 100) / 100;
//     if (Math.abs(diff) > 0) {
//       let maxIdx = 0;
//       for (let i = 1; i < rounded.length; i++) {
//         if (rounded[i].exact > rounded[maxIdx].exact) maxIdx = i;
//       }
//       rounded[maxIdx].pct =
//         Math.round((rounded[maxIdx].pct + diff) * 100) / 100;
//     }

//     const filtered = rounded.filter((it) => it.pct > 0);
//     filtered.sort((a, b) => b.exact - a.exact);

//     return filtered.map((it) => ({ label: it.label, pct: it.pct }));
//   };

//   // ==== Phần hiển thị giao diện ====
//   return (
//     <div style={styles.container}>
//       <h2 style={styles.header}>📂 Web Attack Detection — CSV Upload</h2>
//       <p>
//         ------------------------------------Upload file CSV (flow logs). Hiển
//         thị toàn bộ xác suất dự đoán cho từng
//         nhãn.------------------------------------
//       </p>

//       <form
//         onSubmit={handleSubmit}
//         style={{ display: "flex", gap: 8, alignItems: "center" }}
//       >
//         <input type="file" accept=".csv" onChange={handleFileChange} />
//         <button
//           type="submit"
//           disabled={loading}
//           style={{ padding: "8px 14px" }}
//         >
//           {loading ? "Đang chạy..." : "🚀 Test CSV"}
//         </button>
//       </form>

//       {file && (
//         <p style={styles.fileInfo}>
//           ✅ Đã chọn file: <b>{file.name}</b>
//         </p>
//       )}

//       {error && (
//         <div
//           style={{
//             marginTop: 12,
//             color: "#b00020",
//             background: "#ffecec",
//             padding: 10,
//             borderRadius: 6,
//           }}
//         >
//           <strong>Lỗi:</strong> {String(error)}
//         </div>
//       )}

//       {Array.isArray(predictions) && predictions.length > 0 && (
//         <div style={{ marginTop: 18 }}>
//           <h3>Kết quả</h3>

//           {predictions.length === 1 ? (
//             // ===== Trường hợp 1 dòng =====
//             <div style={{ marginTop: 8 }}>
//               {prepareDisplayPercents(
//                 Object.entries(predictions[0].probabilities || {})
//               ).map((it, idx) => {
//                 const color = palette[idx % palette.length];
//                 const isTop = idx === 0;
//                 return (
//                   <div key={it.label} style={styles.barRow}>
//                     <div style={styles.labelBox}>
//                       {it.label}
//                       {isTop && <span style={styles.topBadge}>Top</span>}
//                     </div>
//                     <div style={styles.barWrap}>
//                       <div style={styles.fill(it.pct, color)} />
//                     </div>
//                     <div style={styles.percentCol}>{it.pct.toFixed(2)}%</div>
//                   </div>
//                 );
//               })}
//             </div>
//           ) : (
//             // ===== Trường hợp nhiều dòng: cộng dồn xác suất =====
//             <div style={{ marginTop: 8 }}>
//               {(() => {
//                 // Gộp tổng xác suất từng nhãn
//                 const summed = {};
//                 for (const p of predictions) {
//                   const probs = p.probabilities || {};
//                   for (const [label, val] of Object.entries(probs)) {
//                     const num = parseFloat(val) || 0;
//                     summed[label] = (summed[label] || 0) + num;
//                   }
//                 }

//                 const display = prepareDisplayPercents(Object.entries(summed));
//                 return display.map((it, idx) => {
//                   const color = palette[idx % palette.length];
//                   const isTop = idx === 0;
//                   return (
//                     <div key={it.label} style={styles.barRow}>
//                       <div style={styles.labelBox}>
//                         {it.label}
//                         {isTop && <span style={styles.topBadge}>Top</span>}
//                       </div>
//                       <div style={styles.barWrap}>
//                         <div style={styles.fill(it.pct, color)} />
//                       </div>
//                       <div style={styles.percentCol}>{it.pct.toFixed(2)}%</div>
//                     </div>
//                   );
//                 });
//               })()}
//             </div>
//           )}
//         </div>
//       )}

//       {!predictions && !error && (
//         <div style={{ marginTop: 18, color: "#666" }}>
//           Chưa có kết quả. Vui lòng upload CSV và nhấn Test.
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useState } from "react";
import axios from "axios";
import "./App.css";

export default function LogTester() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  // 🔄 Reset toàn bộ state
  const handleReset = () => {
    setFile(null);
    setLoading(false);
    setPredictions(null);
    setError(null);
    setUploadedFileName(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // 📁 Chọn file
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setUploadedFileName(selected ? selected.name : null);
    setError(null);
    setPredictions(null);
  };

  // 🚀 Gửi file CSV lên backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("⚠️ Vui lòng chọn file CSV trước khi Test.");
      return;
    }

    setLoading(true);
    setError(null);
    setPredictions(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "http://127.0.0.1:5000/predict_csv",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 6e10,
        }
      );

      const data = res.data;
      if (Array.isArray(data.predictions)) {
        setPredictions(data.predictions);
      } else if (data.missing_columns) {
        setError(
          `⚠️ File CSV thiếu các cột bắt buộc: ${data.missing_columns.join(
            ", "
          )}`
        );
      } else if (data.error) {
        setError(data.details || data.error);
      } else {
        setError("Không nhận được predictions hợp lệ từ backend.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.details || err.response?.data || err.message
      );
    } finally {
      setLoading(false);
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    }
  };

  const palette = [
    "#2f80ed",
    "#00b894",
    "#ffb86b",
    "#ff7675",
    "#9b59b6",
    "#00cec9",
    "#f78fb3",
    "#a29bfe",
  ];

  const prepareDisplayPercents = (entries) => {
    if (!entries || entries.length === 0) return [];
    const parsed = entries
      .map(([label, raw]) => {
        const n = parseFloat(raw);
        return [label, Number.isFinite(n) ? n : 0];
      })
      .filter(([_, v]) => v > 0);

    if (parsed.length === 0) return [];

    const totalRaw = parsed.reduce((s, [, v]) => s + v, 0);
    if (totalRaw <= 0) return [];

    const exact = parsed.map(([label, v]) => ({
      label,
      exact: (v / totalRaw) * 100,
    }));

    const rounded = exact.map((it) => ({
      label: it.label,
      exact: it.exact,
      pct: Math.round(it.exact * 100) / 100,
    }));

    let sumRounded = rounded.reduce((s, it) => s + it.pct, 0);
    const diff = Math.round((100 - sumRounded) * 100) / 100;
    if (Math.abs(diff) > 0) {
      let maxIdx = 0;
      for (let i = 1; i < rounded.length; i++) {
        if (rounded[i].exact > rounded[maxIdx].exact) maxIdx = i;
      }
      rounded[maxIdx].pct =
        Math.round((rounded[maxIdx].pct + diff) * 100) / 100;
    }

    const filtered = rounded.filter((it) => it.pct > 0);
    filtered.sort((a, b) => b.exact - a.exact);

    return filtered.map((it) => ({ label: it.label, pct: it.pct }));
  };

  return (
    <>
      {/* 🔹 Topbar cố định */}
      <div className="topbar">
        <div
          className="topbar-title"
          onClick={handleReset}
          style={{ cursor: "pointer" }}
        >
          🛡️ Web Attack Detection
        </div>
        <div className="topbar-right">
          <h3>G17</h3>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="page-container">
        <h2 className="header">📊 Web Attack Detection (CSV Upload)</h2>
        <p className="subtext">
          Tải lên file CSV chứa log lưu lượng mạng để phân tích. Hệ thống sẽ
          hiển thị xác suất tấn công cho từng loại nhãn.
        </p>

        {/* 🔹 Upload Form */}
        <form onSubmit={handleSubmit} className="upload-section">
          <input
            type="file"
            id="file-upload"
            accept=".csv"
            onChange={handleFileChange}
            hidden
          />
          <label htmlFor="file-upload" className="upload-btn">
            📁 Choose File
          </label>

          <button
            type="submit"
            disabled={loading}
            className={loading ? "btn disabled" : "btn"}
          >
            {loading ? "🔄 Đang xử lý..." : "🚀 Phân tích CSV"}
          </button>
        </form>

        {uploadedFileName && (
          <p className="file-info">
            ✅ <b>{uploadedFileName}</b> đã được chọn
          </p>
        )}

        {error && <div className="error-box">❌ {String(error)}</div>}

        {/* 🔹 Kết quả */}
        {Array.isArray(predictions) && predictions.length > 0 && (
          <div className="result-container">
            <div className="result-title">
              Kết quả dự đoán
              {uploadedFileName && (
                <span className="filename">
                  (File: <b>{uploadedFileName}</b>)
                </span>
              )}
            </div>

            <div className="bars">
              {(() => {
                const summed = {};
                for (const p of predictions) {
                  const probs = p.probabilities || {};
                  for (const [label, val] of Object.entries(probs)) {
                    const num = parseFloat(val) || 0;
                    summed[label] = (summed[label] || 0) + num;
                  }
                }
                const display = prepareDisplayPercents(Object.entries(summed));
                return display.map((it, idx) => {
                  const color = palette[idx % palette.length];
                  const isTop = idx === 0;
                  return (
                    <div key={it.label} className="bar-row">
                      <div className="label-box">
                        {it.label}
                        {isTop && <span className="top-badge">Top</span>}
                      </div>
                      <div className="bar-wrap">
                        <div
                          className="fill"
                          style={{ width: `${it.pct}%`, background: color }}
                        ></div>
                      </div>
                      <div className="percent-col">{it.pct.toFixed(2)}%</div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {!predictions && !error && (
          <div className="footer-temp">
            ⏳ Chưa có kết quả — Hãy chọn file CSV và nhấn “Phân tích CSV”.
          </div>
        )}
      </div>

      {/* Footer cố định */}
      <footer className="footer">
        © 2025 Web Attack Detection — <b>G17</b> | An toàn ứng dụng web và Cơ sở
        dữ liệu 🛡️
      </footer>
    </>
  );
}
