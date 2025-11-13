import * as React from "react";

type Props = {
  subject: string;
  html: string;
  organizerName?: string;
  organizerEmail?: string;
  organizerAddress?: string;
};

export default function BroadcastEmail({ subject, html, organizerName, organizerEmail, organizerAddress }: Props) {
  return (
    <div style={{ fontFamily: "Inter, Noto Sans JP, sans-serif", lineHeight: 1.6 }}>
      <h1>{subject}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {(organizerName || organizerEmail || organizerAddress) && (
        <p style={{ marginTop: 24, fontSize: 12, color: "#6B7280" }}>
          {organizerName ?? ""}
          {organizerEmail ? ` / ${organizerEmail}` : ""}
          {organizerAddress ? ` / ${organizerAddress}` : ""}
        </p>
      )}
    </div>
  );
}

