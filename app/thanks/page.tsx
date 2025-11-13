import { generateQRDataUrl } from "@/lib/qr";

async function getData(token: string) {
  const url = `${process.env.APP_BASE_URL}/api/reservations/verify?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function ThanksPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams?.token;
  if (!token) return <p>トークンがありません。</p>;
  const data = await getData(token);
  if (!data) return <p>予約が見つかりません。</p>;
  const qr = await generateQRDataUrl(`ticket:${token}`);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">予約完了</h1>
      <div className="card">
        <div>演目: {data.show_title}</div>
        <div>日時: {new Date(data.start_at).toLocaleString()}</div>
        <div>会場: {data.venue}</div>
        <div>枚数: {data.qty}</div>
      </div>
      <div>
        <p>受付で以下のQRコードをご提示ください。</p>
        <img src={qr} alt="Reservation QR" width={256} height={256} />
      </div>
      <div>
        <a className="btn-secondary" href={`/api/reservations/cancel?token=${encodeURIComponent(token)}`} onClick={(e) => { e.preventDefault(); fetch(`/api/reservations/cancel?token=${encodeURIComponent(token)}`, { method: "PATCH" }).then(() => window.location.reload()); }}>
          キャンセルする
        </a>
      </div>
    </div>
  );
}

