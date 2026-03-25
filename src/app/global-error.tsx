"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem" }}>نسب — خطأ حرج</h1>
        <p style={{ color: "#666", marginTop: "1rem" }}>{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            background: "#f5f5f5",
          }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
