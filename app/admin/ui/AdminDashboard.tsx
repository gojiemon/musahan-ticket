"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Performance = {
  id: string;
  show_title: string;
  start_at: string;
  venue: string;
  remaining: number;
};

export default function AdminDashboard() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/performances");
      const list = await res.json();
      setPerformances(list);
      setSelected(list[0]?.id ?? null);
    })();
  }, []);

  const downloadCSV = () => {
    const url = selected ? `/api/admin/export.csv?performance_id=${encodeURIComponent(selected)}` : "/api/admin/export.csv";
    window.location.href = url;
  };

  const startScan = async () => {
    setToast(null);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      requestAnimationFrame(tick);
    }
  };

  const stopScan = () => {
    setScanning(false);
    const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
    tracks.forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const tick = () => {
    if (!scanning) return;
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      const text = code.data;
      const token = text.replace(/^ticket:/, "");
      fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).then(async (r) => {
        const ok = r.ok;
        stopScan();
        setToast(ok ? "チェックイン完了" : "検証に失敗しました");
        setTimeout(() => setToast(null), 3000);
      });
    } else {
      requestAnimationFrame(tick);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">管理ダッシュボード</h1>
      <section className="space-y-2">
        <h2 className="font-semibold">予約CSV</h2>
        <div className="flex items-center gap-2">
          <select className="input max-w-md" value={selected ?? ""} onChange={(e) => setSelected(e.target.value)}>
            {performances.map((p) => (
              <option key={p.id} value={p.id}>
                {p.show_title} / {new Date(p.start_at).toLocaleString()} @ {p.venue}
              </option>
            ))}
          </select>
          <button onClick={downloadCSV} className="btn-primary px-3 py-1">CSVダウンロード</button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">チェックイン</h2>
        <div className="flex items-center gap-2">
          {!scanning ? (
            <button onClick={startScan} className="btn-primary px-3 py-1">カメラ起動</button>
          ) : (
            <button onClick={stopScan} className="btn-secondary px-3 py-1">停止</button>
          )}
          {toast && <span className="text-sm">{toast}</span>}
        </div>
        <video ref={videoRef} className="w-full max-w-md rounded border" />
        <canvas ref={canvasRef} className="hidden" />
      </section>
    </div>
  );
}

