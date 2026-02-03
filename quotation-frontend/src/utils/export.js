import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportItemsToCsv({
  filename,
  job,
  items,
  includeAdminFields = false,
}) {
  const header = [
    "Item",
    "Qty",
    ...(includeAdminFields ? ["Unit", "Price (VAT)"] : []),
  ];
  const rows = items.map((item) => [
    item.name || "",
    item.qty ?? "",
    ...(includeAdminFields ? [item.unit || "", item.price || ""] : []),
  ]);

  const meta = [
    ["Technician Name", job.technicianName || ""],
    ["Zone", job.zone || ""],
    ["Customer Name", job.customerName || ""],
    ["Distance from Main Pipe", job.distance || ""],
    ["Main Pipe Size", job.pipeSize || ""],
  ];

  const csvLines = [
    ["Job Details", ""],
    ...meta,
    [""],
    header,
    ...rows,
  ].map((line) => line.map(escapeCsv).join(","));

  const csv = "\ufeff" + csvLines.join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function exportItemsToPdf({ title, job, items, includeAdminFields }) {
  const columns = [
    { label: "Item", key: "name", align: "left" },
    { label: "Qty", key: "qty", align: "right" },
  ];

  if (includeAdminFields) {
    columns.splice(1, 0, { label: "Unit", key: "unit", align: "left" });
    columns.splice(2, 0, {
      label: "Price (VAT)",
      key: "price",
      align: "right",
    });
  }

  const rows = items
    .map((item) =>
      columns
        .map((col) => {
          const value = item[col.key];
          return value == null || value === "" ? "—" : String(value);
        })
        .join("||")
    )
    .map((row) => row.split("||"));

  const tableHeaders = columns
    .map((col) => `<th style="text-align:${col.align};">${col.label}</th>`)
    .join("");

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell, idx) =>
              `<td style="text-align:${columns[idx].align};">${cell}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 4px 0; font-size: 12px; color: #475569; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #cbd5f5; padding: 8px; font-size: 12px; }
      th { background: #f1f5f9; text-transform: uppercase; letter-spacing: 0.04em; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p>Technician: ${job.technicianName || "—"}</p>
    <p>Zone: ${job.zone || "—"}</p>
    <p>Customer: ${job.customerName || "—"}</p>
    <p>Distance: ${job.distance || "—"}</p>
    <p>Main Pipe Size: ${job.pipeSize || "—"}</p>
    <table>
      <thead><tr>${tableHeaders}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function exportOrderToCsv({ filename, order }) {
  const header = ["Item", "Unit", "Qty", "Rate", "Amount"];
  const rows = (order.items || []).map((item) => [
    item.name || "",
    item.unit || "",
    item.qty ?? "",
    item.rate ?? "",
    item.amount ?? "",
  ]);

  const meta = [
    ["Supervisor (Admin)", "—"],
    ["Technician", order.technician_name || ""],
    ["Zone", order.zone || ""],
    ["Customer", order.customer_name || ""],
    ["Distance", order.distance || ""],
    ["Main Pipe Size", order.pipe_size || ""],
  ];

  const totals = [
    ["Material Cost", order.totals?.materialCost ?? ""],
    ["Excavation and backfilling", order.totals?.excavationAmount ?? ""],
    ["Labour charges", order.totals?.labourAmount ?? ""],
    ["Supervision charges", order.totals?.supervisionAmount ?? ""],
    ["Other Charges Cost", order.totals?.otherChargesCost ?? ""],
    ["Grand Total", order.totals?.grandTotal ?? ""],
  ];

  const csvLines = [
    ["Order Details", ""],
    ...meta,
    [""],
    header,
    ...rows,
    [""],
    ["MATERIAL COST", "", "", "", order.totals?.materialCost ?? ""],
    ["OTHER CHARGES", "", "", "", ""],
    ["Excavation and backfilling", "M", order.totals?.distanceQty ?? "", order.totals?.excavationRate ?? "", order.totals?.excavationAmount ?? ""],
    ["Labour charges", "%", 10, order.totals?.labourAmount ?? "", order.totals?.labourAmount ?? ""],
    ["Supervision charges", "%", 15, order.totals?.supervisionAmount ?? "", order.totals?.supervisionAmount ?? ""],
    ["OTHER CHARGES COST", "", "", "", order.totals?.otherChargesCost ?? ""],
    ["GRAND TOTAL", "", "", "", order.totals?.grandTotal ?? ""],
  ].map((line) => line.map(escapeCsv).join(","));

  const csv = "\ufeff" + csvLines.join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function exportOrderToExcel({ filename, order }) {
  const brand = {
    name: "Quotation System",
    title: "Quotation Report",
    headerBg: "1f2937",
    headerFg: "ffffff",
    stripe: "f8fafc",
  };

  const quotationNumber = order.id ?? "";
  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString()
    : "";

  const sheet = [];
  sheet.push([brand.name, "", "", "", ""]);
  sheet.push([brand.title, "", "", "", ""]);
  sheet.push([]);
  sheet.push(["Client Name", order.customer_name || "—", "", "Date", createdDate]);
  sheet.push([
    "Quotation Number",
    quotationNumber,
    "",
    "Generated By",
    order.technician_name || "—",
  ]);
  sheet.push(["Zone", order.zone || "—", "", "Distance", order.distance || "—"]);
  sheet.push(["Main Pipe Size", order.pipe_size || "—", "", "", ""]);
  sheet.push([]);
  sheet.push(["Item", "Unit", "Qty", "Rate", "Amount"]);
  (order.items || []).forEach((item) => {
    sheet.push([
      item.name || "",
      item.unit || "",
      item.qty ?? "",
      item.rate ?? "",
      item.amount ?? "",
    ]);
  });

  sheet.push(["Subtotal", "", "", "", order.totals?.materialCost ?? ""]);
  sheet.push(["Tax", "", "", "", "—"]);
  sheet.push(["GRAND TOTAL", "", "", "", order.totals?.grandTotal ?? ""]);
  sheet.push([]);
  sheet.push(["OTHER CHARGES", "", "", "", ""]);
  sheet.push([
    "Excavation and backfilling",
    "M",
    order.totals?.distanceQty ?? "",
    order.totals?.excavationRate ?? "",
    order.totals?.excavationAmount ?? "",
  ]);
  sheet.push([
    "Labour charges",
    "%",
    10,
    order.totals?.labourAmount ?? "",
    order.totals?.labourAmount ?? "",
  ]);
  sheet.push([
    "Supervision charges",
    "%",
    15,
    order.totals?.supervisionAmount ?? "",
    order.totals?.supervisionAmount ?? "",
  ]);
  sheet.push([
    "OTHER CHARGES COST",
    "",
    "",
    "",
    order.totals?.otherChargesCost ?? "",
  ]);
  sheet.push([]);
  sheet.push(["Generated automatically — no signature required"]);

  const ws = XLSX.utils.aoa_to_sheet(sheet);
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: sheet.length - 1, c: 0 }, e: { r: sheet.length - 1, c: 4 } },
  ];

  const setCell = (addr, style) => {
    if (!ws[addr]) return;
    ws[addr].s = { ...(ws[addr].s || {}), ...style };
  };

  setCell("A1", { font: { bold: true, sz: 18 } });
  setCell("A2", { font: { sz: 12 } });

  const headerRow = 8;
  for (let c = 0; c <= 4; c += 1) {
    const cell = XLSX.utils.encode_cell({ r: headerRow, c });
    setCell(cell, {
      font: { bold: true, color: { rgb: brand.headerFg } },
      fill: { fgColor: { rgb: brand.headerBg } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    });
  }

  const startRow = headerRow + 1;
  const endRow = startRow + (order.items || []).length - 1;
  for (let r = startRow; r <= endRow; r += 1) {
    if ((r - startRow) % 2 === 0) {
      for (let c = 0; c <= 4; c += 1) {
        const cell = XLSX.utils.encode_cell({ r, c });
        setCell(cell, { fill: { fgColor: { rgb: brand.stripe } } });
      }
    }
  }

  const tableEndRow = sheet.length - 3;
  for (let r = headerRow; r <= tableEndRow; r += 1) {
    for (let c = 0; c <= 4; c += 1) {
      const cell = XLSX.utils.encode_cell({ r, c });
      setCell(cell, {
        border: {
          top: { style: "thin", color: { rgb: "cbd5e1" } },
          bottom: { style: "thin", color: { rgb: "cbd5e1" } },
          left: { style: "thin", color: { rgb: "cbd5e1" } },
          right: { style: "thin", color: { rgb: "cbd5e1" } },
        },
        alignment: { vertical: "center", wrapText: true },
      });
    }
  }

  ws["!cols"] = [
    { wch: 40 },
    { wch: 10 },
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
  ];

  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRow, c: 0 },
      e: { r: headerRow, c: 4 },
    }),
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Order");
  const safe = safeFilename(filename);
  XLSX.writeFile(wb, safe.endsWith(".xlsx") ? safe : `${safe}.xlsx`);
}

export function exportOrderToPdf({ filename, title, order }) {
  const margin = 56.7;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const brand = {
    name: "Quotation System",
    color: [31, 41, 55],
    accent: [17, 24, 39],
    headerBg: [31, 41, 55],
    headerFg: [255, 255, 255],
  };
  const quotationNumber = order.id ?? "";
  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString()
    : "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(brand.name, margin, margin);
  doc.setFontSize(12);
  doc.text("Quotation", margin, margin + 18);
  doc.setDrawColor(...brand.accent);
  doc.line(margin, margin + 26, doc.internal.pageSize.getWidth() - margin, margin + 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const leftX = margin;
  const rightX = doc.internal.pageSize.getWidth() / 2 + 10;
  const infoY = margin + 44;
  const lineGap = 14;
  doc.text(`Client Name: ${order.customer_name || "—"}`, leftX, infoY);
  doc.text(`Quotation Number: ${quotationNumber}`, leftX, infoY + lineGap);
  doc.text(`Date: ${createdDate}`, leftX, infoY + lineGap * 2);
  doc.text(`Generated By: ${order.technician_name || "—"}`, leftX, infoY + lineGap * 3);
  doc.text(`Zone: ${order.zone || "—"}`, rightX, infoY);
  doc.text(`Distance: ${order.distance || "—"}`, rightX, infoY + lineGap);
  doc.text(`Main Pipe Size: ${order.pipe_size || "—"}`, rightX, infoY + lineGap * 2);

  const body = (order.items || []).map((item) => [
    item.name || "",
    item.unit || "",
    item.qty ?? "",
    item.rate ?? "",
    item.amount ?? "",
  ]);

  const totals = order.totals || {};
  const sectionRows = [
    ...body,
    ["Subtotal", "", "", "", totals.materialCost ?? ""],
    ["Tax", "", "", "", "—"],
    ["GRAND TOTAL", "", "", "", totals.grandTotal ?? ""],
    ["OTHER CHARGES", "", "", "", ""],
    [
      "Excavation and backfilling",
      "M",
      totals.distanceQty ?? "",
      totals.excavationRate ?? "",
      totals.excavationAmount ?? "",
    ],
    ["Labour charges", "%", 10, totals.labourAmount ?? "", totals.labourAmount ?? ""],
    ["Supervision charges", "%", 15, totals.supervisionAmount ?? "", totals.supervisionAmount ?? ""],
    ["OTHER CHARGES COST", "", "", "", totals.otherChargesCost ?? ""],
  ];

  autoTable(doc, {
    startY: infoY + lineGap * 4 + 6,
    head: [["Item", "Unit", "Qty", "Rate", "Amount"]],
    body: sectionRows,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: brand.headerBg, textColor: brand.headerFg },
    alternateRowStyles: { fillColor: [245, 246, 248] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    didParseCell: (data) => {
      const label = data.row?.raw?.[0];
      if (
        label === "Subtotal" ||
        label === "GRAND TOTAL" ||
        label === "OTHER CHARGES" ||
        label === "OTHER CHARGES COST"
      ) {
        data.cell.styles.fontStyle = "bold";
      }
      if (label === "GRAND TOTAL") {
        data.cell.styles.fillColor = [15, 23, 42];
        data.cell.styles.textColor = [255, 255, 255];
      }
    },
    margin: { left: margin, right: margin },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - margin,
      doc.internal.pageSize.getHeight() - 18,
      { align: "right" }
    );
    doc.text(
      "This document is system generated",
      margin,
      doc.internal.pageSize.getHeight() - 18
    );
  }

  const safe = safeFilename(filename);
  doc.save(safe.endsWith(".pdf") ? safe : `${safe}.pdf`);
}

function safeFilename(name) {
  return String(name || "export")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function exportAllOrdersToExcel({ filename, orders }) {
  const brand = {
    name: "Quotation System",
    title: "Quotation Report (All Orders)",
    headerBg: "1f2937",
    headerFg: "ffffff",
    stripe: "f8fafc",
  };

  const sheet = [];
  const orderSections = [];
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];
  sheet.push([brand.name, "", "", "", ""]);
  sheet.push([brand.title, "", "", "", ""]);
  sheet.push([]);
  (orders || []).forEach((order) => {
    const customerRow = sheet.length;
    sheet.push([order.customer_name || "Customer"]);
    merges.push({ s: { r: customerRow, c: 0 }, e: { r: customerRow, c: 4 } });
    sheet.push([
      "Order ID",
      order.id ?? "",
      "",
      "Date",
      order.created_at ? new Date(order.created_at).toLocaleDateString() : "",
      "",
    ]);
    sheet.push([
      "Technician",
      order.technician_name || "",
      "",
      "Zone",
      order.zone || "",
      "",
    ]);
    sheet.push([
      "Distance",
      order.distance || "",
      "",
      "Main Pipe Size",
      order.pipe_size || "",
      "",
    ]);
    sheet.push([]);
    const headerRow = sheet.length;
    sheet.push(["Item", "Unit", "Qty", "Rate", "Amount"]);
    const itemStartRow = sheet.length;
    (order.items || []).forEach((item) => {
      sheet.push([
        item.name || "",
        item.unit || "",
        item.qty ?? "",
        item.rate ?? "",
        item.amount ?? "",
      ]);
    });
    const itemEndRow = Math.max(itemStartRow, sheet.length - 1);
    sheet.push(["MATERIAL COST", "", "", "", order.totals?.materialCost ?? ""]);
    sheet.push([
      "Excavation and backfilling",
      "M",
      order.totals?.distanceQty ?? "",
      order.totals?.excavationRate ?? "",
      order.totals?.excavationAmount ?? "",
    ]);
    sheet.push([
      "Labour charges",
      "%",
      10,
      order.totals?.labourAmount ?? "",
      order.totals?.labourAmount ?? "",
    ]);
    sheet.push([
      "Supervision charges",
      "%",
      15,
      order.totals?.supervisionAmount ?? "",
      order.totals?.supervisionAmount ?? "",
    ]);
    sheet.push([
      "OTHER CHARGES COST",
      "",
      "",
      "",
      order.totals?.otherChargesCost ?? "",
    ]);
    sheet.push(["GRAND TOTAL", "", "", "", order.totals?.grandTotal ?? ""]);
    const endRow = sheet.length - 1;
    orderSections.push({
      customerRow,
      headerRow,
      itemStartRow,
      itemEndRow,
      endRow,
    });
    sheet.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheet);
  ws["!merges"] = merges;
  const setCell = (addr, style) => {
    if (!ws[addr]) return;
    ws[addr].s = { ...(ws[addr].s || {}), ...style };
  };
  setCell("A1", { font: { bold: true, sz: 18 } });
  setCell("A2", { font: { sz: 12 } });

  const headerRows = [];
  for (let r = 0; r < sheet.length; r += 1) {
    const row = sheet[r];
    if (!row) continue;
    if (row[0] === "Item" && row[1] === "Unit") {
      headerRows.push(r);
    }
  }
  headerRows.forEach((headerRow) => {
    for (let c = 0; c <= 4; c += 1) {
      const cell = XLSX.utils.encode_cell({ r: headerRow, c });
      setCell(cell, {
        font: { bold: true, sz: 11, color: { rgb: brand.headerFg } },
        fill: { fgColor: { rgb: brand.headerBg } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
      });
    }
  });

  const border = {
    top: { style: "thin", color: { rgb: "d1d5db" } },
    bottom: { style: "thin", color: { rgb: "d1d5db" } },
    left: { style: "thin", color: { rgb: "d1d5db" } },
    right: { style: "thin", color: { rgb: "d1d5db" } },
  };

  orderSections.forEach(
    ({ customerRow, headerRow, itemStartRow, itemEndRow, endRow }) => {
    setCell(XLSX.utils.encode_cell({ r: customerRow, c: 0 }), {
      font: { bold: true, sz: 12 },
      alignment: { vertical: "center", horizontal: "left" },
    });
    for (let c = 0; c <= 4; c += 1) {
      const cell = XLSX.utils.encode_cell({ r: headerRow, c });
      setCell(cell, { border });
    }
    for (let r = headerRow + 1; r <= endRow; r += 1) {
      for (let c = 0; c <= 4; c += 1) {
        const cell = XLSX.utils.encode_cell({ r, c });
        setCell(cell, {
          border,
          alignment: {
            vertical: "center",
            horizontal: c >= 2 ? "right" : "left",
            wrapText: true,
          },
        });
      }
    }
    for (let r = itemStartRow; r <= itemEndRow; r += 1) {
      if ((r - itemStartRow) % 2 === 1) {
        for (let c = 0; c <= 4; c += 1) {
          const cell = XLSX.utils.encode_cell({ r, c });
          setCell(cell, { fill: { fgColor: { rgb: brand.stripe } } });
        }
      }
    }
  });

  ws["!cols"] = [
    { wch: 36 },
    { wch: 12 },
    { wch: 8 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  const safe = safeFilename(filename);
  XLSX.writeFile(wb, safe.endsWith(".xlsx") ? safe : `${safe}.xlsx`);
}

export function exportAllOrdersToPdf({ filename, orders }) {
  const margin = 56.7;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const brand = {
    name: "Quotation System",
    headerBg: [31, 41, 55],
    headerFg: [255, 255, 255],
  };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(brand.name, margin, margin);
  doc.setFontSize(12);
  doc.text("Quotation Report (All Orders)", margin, margin + 18);
  doc.line(margin, margin + 26, doc.internal.pageSize.getWidth() - margin, margin + 26);

  const allRows = [];
  (orders || []).forEach((order) => {
    allRows.push([
      `Order #${order.id ?? ""} - ${order.customer_name || ""}`,
      "",
      "",
      "",
      "",
    ]);
    (order.items || []).forEach((item) => {
      allRows.push([
        item.name || "",
        item.unit || "",
        item.qty ?? "",
        item.rate ?? "",
        item.amount ?? "",
      ]);
    });
    allRows.push([
      "MATERIAL COST",
      "",
      "",
      "",
      order.totals?.materialCost ?? "",
    ]);
    allRows.push([
      "Excavation and backfilling",
      "M",
      order.totals?.distanceQty ?? "",
      order.totals?.excavationRate ?? "",
      order.totals?.excavationAmount ?? "",
    ]);
    allRows.push([
      "Labour charges",
      "%",
      10,
      order.totals?.labourAmount ?? "",
      order.totals?.labourAmount ?? "",
    ]);
    allRows.push([
      "Supervision charges",
      "%",
      15,
      order.totals?.supervisionAmount ?? "",
      order.totals?.supervisionAmount ?? "",
    ]);
    allRows.push([
      "OTHER CHARGES COST",
      "",
      "",
      "",
      order.totals?.otherChargesCost ?? "",
    ]);
    allRows.push(["GRAND TOTAL", "", "", "", order.totals?.grandTotal ?? ""]);
    allRows.push(["", "", "", "", ""]);
  });

  autoTable(doc, {
    startY: margin + 40,
    head: [["Item", "Unit", "Qty", "Rate", "Amount"]],
    body: allRows,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: brand.headerBg, textColor: brand.headerFg },
    alternateRowStyles: { fillColor: [245, 246, 248] },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      const label = data.row?.raw?.[0];
      if (label && label.startsWith("Order #")) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [230, 234, 240];
      }
      if (label === "GRAND TOTAL") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [15, 23, 42];
        data.cell.styles.textColor = [255, 255, 255];
      }
      if (label === "MATERIAL COST" || label === "OTHER CHARGES COST") {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const safe = safeFilename(filename);
  doc.save(safe.endsWith(".pdf") ? safe : `${safe}.pdf`);
}
