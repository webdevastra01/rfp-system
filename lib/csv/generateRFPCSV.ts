import ExcelJS from "exceljs";

export async function exportRFPExcel(data: any[]) {
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("RFP Report", {
    views: [
      {
        state: "frozen",
        ySplit: 1,
      },
    ],
  });

  worksheet.columns = [
    { header: "Requested Date", key: "requestedDate", width: 15 },
    { header: "Due Date", key: "dueDate", width: 15 },
    { header: "RFP Number", key: "rfpNumber", width: 22 },
    { header: "Car Name", key: "carName", width: 25 },
    { header: "Plate Number", key: "plateNumber", width: 18 },
    { header: "Vehicle Owner", key: "vehicleOwner", width: 28 },
    { header: "Requestor", key: "requestor", width: 25 },
    { header: "Payable To", key: "payableTo", width: 25 },
    { header: "Description", key: "description", width: 60 },
    { header: "Requested Amount", key: "requestedAmount", width: 18 },
    { header: "Payment Method", key: "paymentMethod", width: 20 },
    { header: "Order Number", key: "orderNumber", width: 20 },
    { header: "Order Type", key: "orderType", width: 15 },
  ];

  data.forEach((rfp) => {
    worksheet.addRow({
      requestedDate: new Date(rfp.created_at).toLocaleDateString(),
      dueDate: rfp.due_date,
      rfpNumber: rfp.rfp_number,
      carName: rfp.vehicle?.car_type ?? "",
      plateNumber: rfp.vehicle?.plate_number ?? "",
      vehicleOwner: rfp.vehicle
        ? `${rfp.vehicle.owners_first_name} ${rfp.vehicle.owners_last_name}`
        : "",
      requestor: rfp.requested_by ?? "",
      payableTo: rfp.payable_to ?? "",
      description: rfp.description ?? "",
      requestedAmount: Number(rfp.total_payable),
      paymentMethod: rfp.payment_method ?? "",
      orderNumber: rfp.order_number,
      orderType: rfp.order_type,
    });
  });

  // Header styling
  const headerRow = worksheet.getRow(1);

  headerRow.font = {
    bold: true,
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  // Wrap text for all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = {
        wrapText: true,
        vertical: "top",
      };
    });
  });

  // Currency format
  worksheet.getColumn("requestedAmount").numFmt = "₱#,##0.00;[Red]-₱#,##0.00";

  // Auto filter
  worksheet.autoFilter = {
    from: "A1",
    to: "M1",
  };

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `RFP_Report_${new Date().toISOString().split("T")[0]}.xlsx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
}
