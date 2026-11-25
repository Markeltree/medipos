"use client";

import * as React from "react";
import { formatDateTime, formatPKR } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import type { Sale } from "@/types";

/**
 * Printable receipt. Only the element with id="print-receipt" is shown when
 * printing (see the @media print rules in globals.css).
 */
export function Receipt({ sale }: { sale: Sale }) {
  const profile = useDataStore((s) => s.profile);
  const lines = sale.items;
  return (
    <div
      id="print-receipt"
      className="mx-auto w-full max-w-[300px] bg-white p-3 font-mono text-[11.5px] leading-relaxed text-black"
    >
      <div className="text-center">
        <p className="text-[13px] font-bold">{profile.pharmacyName}</p>
        <p>{profile.address}</p>
        <p>{profile.city} · Tel {profile.phone}</p>
        <p>NTN {profile.ntn} · Lic {profile.licenseNumber}</p>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="flex justify-between">
        <span>Invoice</span>
        <span>{sale.id}</span>
      </div>
      <div className="flex justify-between">
        <span>Date</span>
        <span>{formatDateTime(sale.date)}</span>
      </div>
      <div className="flex justify-between">
        <span>Customer</span>
        <span className="max-w-[60%] truncate text-right">{sale.customerName}</span>
      </div>
      <div className="flex justify-between">
        <span>Cashier</span>
        <span>{sale.cashier}</span>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th className="font-normal">Item</th>
            <th className="text-right font-normal">Qty</th>
            <th className="text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.medicineId}>
              <td className="pr-1 align-top">
                {l.name} {l.strength}
                <div className="text-[10px] opacity-70">@ {formatPKR(l.unitPrice)}</div>
              </td>
              <td className="text-right align-top">{l.quantity}</td>
              <td className="text-right align-top">{formatPKR(l.unitPrice * l.quantity - l.discount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="my-2 border-t border-dashed border-black" />
      <Row label="Subtotal" value={formatPKR(sale.subtotal)} />
      {sale.discount > 0 && <Row label="Discount" value={`- ${formatPKR(sale.discount)}`} />}
      <Row label={`Tax (${profile.taxRate}%)`} value={formatPKR(sale.tax)} />
      <div className="mt-1 flex justify-between text-[13px] font-bold">
        <span>TOTAL</span>
        <span>{formatPKR(sale.total)}</span>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <Row label={`Paid (${sale.paymentMethod})`} value={formatPKR(sale.amountReceived)} />
      {sale.change > 0 && <Row label="Change" value={formatPKR(sale.change)} />}
      <div className="my-3 border-t border-dashed border-black" />
      <p className="text-center text-[10.5px]">{profile.invoiceFooter}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
