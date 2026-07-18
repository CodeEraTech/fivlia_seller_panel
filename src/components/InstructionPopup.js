import React from "react";
import { MdStickyNote2 } from "react-icons/md";

const InstructionPopup = ({ data, onOk }) => {
  if (!data) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,.45)",
        backdropFilter: "blur(3px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
        padding: 20,
      }}
    >
      <div
        style={{
          width: 480,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          boxShadow: "0 15px 40px rgba(0,0,0,.15)",
          animation: "popupAnimation .2s ease",
        }}
      >
        <style>{`
          @keyframes popupAnimation{
            from{
              opacity:0;
              transform:translateY(20px) scale(.98);
            }
            to{
              opacity:1;
              transform:translateY(0) scale(1);
            }
          }
        `}</style>

        {/* Header */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
            padding: "20px 24px",
            borderBottom: "1px solid #F1F5F9",
            background: "#FFFFFF",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#EEF4FF",
              color: "#2563EB",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 28,
            }}
          >
            <MdStickyNote2 />
          </div>

          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Customer Instruction
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginTop: 4,
              }}
            >
              New instruction received for this order
            </div>
          </div>
        </div>

        {/* Body */}

        <div style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                color: "#6B7280",
                fontWeight: 600,
              }}
            >
              Order ID
            </span>

            <span
              style={{
                background: "#F3F4F6",
                padding: "6px 12px",
                borderRadius: 8,
                fontWeight: 700,
                color: "#111827",
                fontSize: 14,
              }}
            >
              {data.orderId}
            </span>
          </div>

          <div
            style={{
              border: "1px solid #E5E7EB",
              borderLeft: "5px solid #2563EB",
              background: "#F8FAFC",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#111827",
                marginBottom: 10,
                fontSize: 15,
              }}
            >
              Instruction
            </div>

            <div
              style={{
                color: "#4B5563",
                fontSize: 15,
                lineHeight: "24px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {data.note}
            </div>
          </div>

          <button
            onClick={onOk}
            style={{
              marginTop: 24,
              width: "100%",
              height: 48,
              border: "none",
              borderRadius: 10,
              background: "#2563EB",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: ".2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1D4ED8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2563EB";
            }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructionPopup;