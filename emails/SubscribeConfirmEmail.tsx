import * as React from "react";

type Props = {
  name?: string | null;
  confirmUrl: string;
  organizerName: string;
};

export default function SubscribeConfirmEmail({ name, confirmUrl, organizerName }: Props) {
  return (
    <div style={{ fontFamily: "Inter, Noto Sans JP, sans-serif", lineHeight: 1.6 }}>
      <h1>メール購読の確認</h1>
      <p>{name ? `${name} 様` : "様"}, 購読の確認をお願いします。</p>
      <p>以下のリンクを24時間以内にクリックして確定してください。</p>
      <p><a href={confirmUrl}>{confirmUrl}</a></p>
      <p>いつでも本文のリンクから配信停止できます。</p>
      <p>— {organizerName}</p>
    </div>
  );
}

