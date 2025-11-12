import * as React from "react";

type Props = {
  name: string;
  email: string;
  qty: number;
  showTitle: string;
  startAt: string;
  venue: string;
  venueText?: string;
  organizerName: string;
  organizerEmail: string;
  organizerAddress?: string;
  qrDataUrl: string;
  cancelUrl: string;
};

export default function ReservationEmail(p: Props) {
  return (
    <div style={{ fontFamily: "Inter, Noto Sans JP, sans-serif", lineHeight: 1.6 }}>
      <h1>予約確定のお知らせ</h1>
      <p>{p.name} 様、予約を受け付けました。</p>
      <ul>
        <li>演目: {p.showTitle}</li>
        <li>日時: {p.startAt}</li>
        <li>会場: {p.venue}</li>
        <li>枚数: {p.qty}</li>
      </ul>
      {p.venueText ? <p>{p.venueText}</p> : null}
      <p>受付で以下のQRコードをご提示ください。</p>
      <img src={p.qrDataUrl} alt="Reservation QR" width="256" height="256" />
      <p>
        キャンセルはこちら: <a href={p.cancelUrl}>{p.cancelUrl}</a>
      </p>
      <hr />
      <p>
        {p.organizerName} / {p.organizerEmail}
        {p.organizerAddress ? ` / ${p.organizerAddress}` : ""}
      </p>
    </div>
  );
}

