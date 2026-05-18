import { useCallback, useEffect, useRef, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  
const BUTTONS = [
  ["C",   "clear",     "accent",  1],
  ["(",   "(",         "fn",      1],
  [")",   ")",         "fn",      1],
  ["⌫",  "backspace", "accent",  1],
  ["%",   "%",         "fn",      1],
  ["x!",  "fact(",     "fn",      1],
  ["xʸ",  "pow(",      "fn",      1],

  ["7",   "7",         "num",     1],
  ["8",   "8",         "num",     1],
  ["9",   "9",         "num",     1],
  ["×",   "*",         "op",      1],
  ["÷",   "/",         "op",      1],
  ["ln",  "ln(",       "fn",      1],
  ["e",   "e",         "fn",      1],

  ["4",   "4",         "num",     1],
  ["5",   "5",         "num",     1],
  ["6",   "6",         "num",     1],
  ["+",   "+",         "op",      1],
  ["x²",  "^2",        "fn",      1],
  ["log", "log(",      "fn",      1],
  ["cos", "cos(",      "fn",      1],

  ["1",   "1",         "num",     1],
  ["2",   "2",         "num",     1],
  ["3",   "3",         "num",     1],
  ["−",   "-",         "op",      1],
  ["√",   "sqrt(",     "fn",      1],
  ["sin", "sin(",      "fn",      1],
  ["tan", "tan(",      "fn",      1],

  ["±",   "negate",   "fn",      1],
  ["0",   "0",         "num",     1],
  [".",   ".",         "num",     1],
  ["=",   "calculate", "eq",      1],
  ["π",   "pi",        "fn",      1],
  ["°",   "deg(",      "fn",      1],
  ["rad", "rad(",      "fn",      1],
];

export default function App() {
  const [expression, setExpression] = useState("");
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [history, setHistory]       = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [flash, setFlash]           = useState(null);
  const inputRef = useRef(null);

  const focus = () => inputRef.current?.focus();

  const triggerFlash = (type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 350);
  };

  const append    = useCallback((v) => { setExpression(p => p + v); setError(""); focus(); }, []);
  const clear     = useCallback(() => { setExpression(""); setResult(null); setError(""); focus(); }, []);
  const backspace = useCallback(() => { setExpression(p => p.slice(0, -1)); focus(); }, []);
  const negate    = useCallback(() => { setExpression(p => p + "-"); focus(); }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const r = await fetch(`${BASE_URL}/history`);
      const d = await r.json();
      setHistory(d);
    } catch {}
  }, []);

  const calculate = useCallback(async () => {
    if (!expression.trim()) return;
    setError(""); setResult(null); setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Something went wrong");
        triggerFlash("err");
      } else {
        setResult(d.result);
        triggerFlash("ok");
        await fetchHistory();
      }
    } catch {
      setError("Could not connect to backend");
      triggerFlash("err");
    } finally {
      setLoading(false);
      focus();
    }
  }, [expression, fetchHistory]);

  const clearHistory = async () => {
    try {
      await fetch(`${BASE_URL}/history`, { method: "DELETE" });
      setHistory([]);
    } catch {
      setError("Could not clear history");
    }
  };

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    focus();
    const allowed = "0123456789+-*/%.(), ";
    const onKey = (e) => {
      if (e.key === "Enter")          { e.preventDefault(); calculate(); }
      else if (e.key === "Backspace") { e.preventDefault(); backspace(); }
      else if (e.key === "Escape")    { e.preventDefault(); clear(); }
      else if (allowed.includes(e.key)) { e.preventDefault(); append(e.key); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expression, calculate, backspace, clear, append]);

  const handleButton = (action) => {
    if (action === "clear")     return clear();
    if (action === "backspace") return backspace();
    if (action === "calculate") return calculate();
    if (action === "negate")    return negate();
    append(action);
  };

  const displayValue = expression || "";
  const openParens = [...expression].reduce((n, c) => n + (c === "(" ? 1 : c === ")" ? -1 : 0), 0);

  return (
    <div style={S.page}>
      <div style={S.card}>

        <div style={{ ...S.displayWrap, ...(flash === "ok" ? S.flashOk : flash === "err" ? S.flashErr : {}) }}>
          <div style={S.expressionRow}>
            <span style={S.expressionText}>{prettify(displayValue) || <span style={S.placeholder}>0</span>}</span>
            {openParens > 0 && (
              <span style={S.parenHint}>{")" .repeat(openParens)}</span>
            )}
          </div>
          {result !== null && !error && (
            <div style={S.resultRow}>= {formatNumber(result)}</div>
          )}
        </div>

        {error && (
          <div style={S.errorRow}>⚠ {error}</div>
        )}

        <div style={S.grid}>
          {BUTTONS.map(([label, action, variant]) => (
            <button
              key={label}
              style={{ ...S.btn, ...S[`btn_${variant}`] }}
              onClick={() => handleButton(action)}
              onMouseDown={e => e.preventDefault()}
            >
              {loading && action === "calculate" ? "…" : label}
            </button>
          ))}
        </div>

        <button style={S.historyToggle} onClick={() => setShowHistory(v => !v)}>
          {showHistory ? "▲ Hide History" : "▼ Show History"}
          {history.length > 0 && <span style={S.badge}>{history.length}</span>}
        </button>

        {showHistory && (
          <div style={S.historyPanel}>
            <div style={S.historyHeader}>
              <span style={S.historyTitle}>History</span>
              <button style={S.clearBtn} onClick={clearHistory}>Clear</button>
            </div>
            {history.length === 0
              ? <div style={S.emptyHist}>No calculations yet</div>
              : [...history].reverse().map((item) => (
                  <div
                    key={item.id}
                    style={S.histItem}
                    onClick={() => { setExpression(item.expression); setResult(null); setError(""); focus(); }}
                    title="Click to restore"
                  >
                    <span style={S.histExpr}>{prettify(item.expression) || item.expression}</span>
                    <span style={S.histResult}>= {formatNumber(item.result)}</span>
                  </div>
                ))
            }
          </div>
        )}
      </div>

      <input ref={inputRef} style={S.hiddenInput} readOnly value={expression} onChange={() => {}} />
    </div>
  );
}

function prettify(raw) {
  if (!raw) return null;

  let s = raw;
  s = s.replace(/\*/g, "×");
  s = s.replace(/\//g, "÷");
  s = s.replace(/-/g, "−");
  s = s.replace(/\bpi\b/g, "π");
  s = s.replace(/\^2/g, "²");

  const FN_RE = /(\bfact\(|\bsqrt\(|\bpow\(|\bln\(|\blog\(|\bdeg\(|\brad\(|\bcos\(|\bsin\(|\btan\()/g;

  const PRETTY_FN = {
    "fact(": "fact(",
    "sqrt(": "√(",
    "pow(":  "pow(",
    "ln(":   "ln(",
    "log(":  "log(",
    "deg(":  "deg(",
    "rad(":  "rad(",
    "cos(":  "cos(",
    "sin(":  "sin(",
    "tan(":  "tan(",
  };

  const parts = s.split(FN_RE);

  return parts.map((part, i) => {
    const key = i;
    if (FN_RE.test(part)) {
      FN_RE.lastIndex = 0;
      const pretty = PRETTY_FN[part] ?? part;
      return <span key={key} style={{ color: "#69dff0", fontSize: "20px" }}>{pretty}</span>;
    }
    FN_RE.lastIndex = 0;
    return <span key={key}>{part}</span>;
  });
}

function formatNumber(n) {
  if (typeof n !== "number") return n;
  if (Math.abs(n) < 1e15 && Math.abs(n) > 1e-7 || n === 0) {
    return parseFloat(n.toPrecision(10)).toString();
  }
  return n.toExponential(6);
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#f5f3dc",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "30px",
    fontFamily: "'Courier New', 'Courier', monospace",
  },
  card: {
    width: "620px",
    padding: "24px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.45)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
    backdropFilter: "blur(2px)",
  },
  displayWrap: {
    background: "#2a2a2a",
    borderRadius: "10px",
    padding: "14px 16px 12px",
    marginBottom: "16px",
    minHeight: "80px",
    transition: "background 0.25s",
  },
  flashOk:  { background: "#1a3a2a" },
  flashErr: { background: "#3a1a1a" },
  expressionRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    flexWrap: "wrap",
  },
  expressionText: {
    color: "#eaf6ff",
    fontSize: "24px",
    wordBreak: "break-all",
    lineHeight: 1.3,
  },
  placeholder: { color: "#666" },
  parenHint: {
    color: "#ffbd5988",
    fontSize: "22px",
    userSelect: "none",
  },
  resultRow: {
    marginTop: "6px",
    color: "#ffbd59",
    fontSize: "20px",
    fontWeight: "bold",
  },
  errorRow: {
    marginBottom: "12px",
    color: "#d62828",
    background: "#ffe0e0",
    padding: "8px 10px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "7px",
  },
  btn: {
    height: "40px",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    cursor: "pointer",
    transition: "filter 0.1s, transform 0.08s",
    fontFamily: "inherit",
    fontWeight: "600",
  },
  btn_num:    { background: "#888", color: "#111" },
  btn_op:     { background: "#69dff0", color: "#111" },
  btn_fn:     { background: "#b8eaf3", color: "#111" },
  btn_accent: { background: "#ffbd59", color: "#111" },
  btn_eq:     { background: "#ffbd59", color: "#111" },
  hiddenInput: {
    position: "fixed",
    opacity: 0,
    pointerEvents: "none",
    width: 0,
    height: 0,
  },
  historyToggle: {
    marginTop: "14px",
    width: "100%",
    height: "38px",
    border: "none",
    borderRadius: "8px",
    background: "#3a3a3a",
    color: "#eee",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "inherit",
  },
  badge: {
    background: "#ffbd59",
    color: "#111",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "bold",
    padding: "1px 7px",
  },
  historyPanel: {
    marginTop: "10px",
    background: "#2c2c2c",
    borderRadius: "10px",
    padding: "12px",
    maxHeight: "280px",
    overflowY: "auto",
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  historyTitle: {
    color: "#fff",
    fontSize: "15px",
    fontWeight: "bold",
  },
  clearBtn: {
    border: "none",
    borderRadius: "6px",
    background: "#ffbd59",
    color: "#111",
    fontSize: "13px",
    fontWeight: "bold",
    padding: "4px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  histItem: {
    background: "#3d3d3d",
    borderRadius: "6px",
    padding: "8px 12px",
    marginBottom: "8px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    transition: "background 0.15s",
  },
  histExpr:   { color: "#ccc", fontSize: "14px", wordBreak: "break-all" },
  histResult: { color: "#ffbd59", fontSize: "14px", fontWeight: "bold", whiteSpace: "nowrap" },
  emptyHist:  { color: "#777", fontSize: "14px", textAlign: "center", padding: "12px 0" },
};
