const COMPANIES = {
  MAIP: 25,
  "MAIP FINANCED": 20,
  EMBARK: 18,
  "EMBARK EP/NP": 25,
  Arbella: 10,
  Commerce: 8.33,
  "Bristol West": 0,
  Safety: 20,
  "Safety EFT": 8,
  "Plymouth Rock": 20,
  "Plymouth Rock EFT": 15,
  Quincy: 20,
  "Quincy EFT": 10,
  "Quincy 12P": 8.3,
  Safeco: 0,
  Hanover: 0,
  "National General": 0,
  Progressive: 0,
};

const PLATES = {
  "Passenger Plate": 60,
  "Motorcycle Plate": 20,
  "Plate Transfer": 25,
};

const TITLE_FEE = 75;
const AGENCY_FEES = { MAIP: 40, Direct: 50 };

let lastPremium = null;
let lastReg = null;

// Populate companies
const companySelect = document.getElementById("company");
Object.keys(COMPANIES).forEach((c) => {
  let opt = document.createElement("option");
  opt.value = c;
  opt.textContent = c;
  companySelect.appendChild(opt);
});

companySelect.addEventListener("change", () => {
  document.getElementById("down").value = COMPANIES[companySelect.value];
});

function loadPlates() {
  const plateSelect = document.getElementById("plate");
  Object.keys(PLATES).forEach((p) => {
    let opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    plateSelect.appendChild(opt);
  });
}

function handleSaleChange() {
  const sale = document.getElementById("sale").value;
  document.getElementById("price").disabled = sale === "Private Sale";
  document.getElementById("value").disabled = sale === "Dealer Sale";
}

function handleRegisterChange() {
  const register = document.getElementById("register").value;
  document.getElementById("policy").disabled = register !== "Yes";
}

function calculatePremium() {
  const premium = parseFloat(document.getElementById("premium").value);
  const dpPercent = parseFloat(document.getElementById("down").value);
  const term = parseInt(document.getElementById("term").value);
  const company = companySelect.value;

  if (!premium || isNaN(dpPercent) || term < 6 || term > 12) {
    alert(
      "Please enter valid numbers for premium, downpayment, and term (6-12 months)."
    );
    return;
  }

  const downPay = (premium * dpPercent) / 100;
  const amountFinanced = premium - downPay;

  let monthly;
  let interest = 0;
  let serviceCharge = 0;
  let totalPayments = amountFinanced;

  if (company === "MAIP FINANCED") {
    const APR = 0.1861;
    serviceCharge = 16;

    // Simple interest approximation
    interest = amountFinanced * APR * (term / 12);

    totalPayments = amountFinanced + interest + serviceCharge;
    monthly = totalPayments / term;
  } else {
    monthly = amountFinanced / term;
  }

  const resultHTML =
    `Premium: $${premium.toFixed(2)}\n` +
    `Downpayment: $${downPay.toFixed(2)}\n` +
    `Amount Financed: $${amountFinanced.toFixed(2)}\n` +
    (company === "MAIP FINANCED"
      ? `Interest: $${interest.toFixed(2)}\n` +
        `Service Charge: $${serviceCharge.toFixed(2)}\n` +
        `Total Payments: $${totalPayments.toFixed(2)}\n`
      : "") +
    `Monthly Payment: $${monthly.toFixed(2)}\n` +
    `Company: ${company}\n` +
    `Term: ${term} months`;

  document.getElementById("premiumResult").textContent = resultHTML;

  lastPremium = {
    premium,
    downPay,
    dpPercent,
    amountFinanced,
    interest,
    serviceCharge,
    totalPayments,
    term,
    monthly,
    customer: document.getElementById("customer").value || "N/A",
    company
  };
}

function resetPremium() {
  document.getElementById("customer").value = "";
  document.getElementById("premium").value = "";
  document.getElementById("down").value = "";
  document.getElementById("term").value = "";
  document.getElementById("premiumResult").textContent = "";
  lastPremium = null;
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function drawPdfHeader(doc, title, subtitle) {
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 15, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 15, 24);

  doc.setFontSize(9);
  doc.text(
    "A-Affordable Insurance • Massachusetts",
    195,
    24,
    { align: "right" }
  );

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  doc.line(15, 29, 195, 29);

  doc.setDrawColor(224, 229, 239);
  doc.setLineWidth(0.5);
  doc.roundedRect(7, 7, 196, 283, 4, 4, "S");

  doc.setTextColor(0, 0, 0);
}

function renderKeyValue(doc, label, value, y, labelX = 16, valueX = 164) {
  doc.setFont("helvetica", "bold");
  doc.text(label, labelX, y);
  doc.setFont("helvetica", "normal");
  doc.text(value, valueX, y, { align: "right" });
}

function generatePremiumPDF() {
  if (!lastPremium) {
    alert("Please calculate the premium first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  drawPdfHeader(doc, "A-Affordable Insurance", "Premium Quote");

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(12, 34, 186, 42, 4, 4, "F");

  doc.setFontSize(10);
  renderKeyValue(doc, "Customer", lastPremium.customer, 42);
  renderKeyValue(doc, "Company", lastPremium.company, 50);
  renderKeyValue(doc, "Term", `${lastPremium.term} months`, 58);
  renderKeyValue(doc, "Date", new Date().toLocaleDateString(), 66);

  doc.setFillColor(249, 250, 252);
  doc.roundedRect(12, 80, 186, 75, 4, 4, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Quote Summary", 16, 92);

  const rows = [
    ["Premium", formatCurrency(lastPremium.premium)],
    ["Downpayment", formatCurrency(lastPremium.downPay)],
    ["Amount Financed", formatCurrency(lastPremium.amountFinanced)],
  ];

  if (lastPremium.company === "MAIP FINANCED") {
    rows.push([
      "Interest",
      formatCurrency(lastPremium.interest)
    ]);
    rows.push([
      "Service Charge", formatCurrency(lastPremium.serviceCharge)]);
    rows.push([
      "Total Payments", formatCurrency(lastPremium.totalPayments)]);
  }

  rows.push(["Monthly Payment", formatCurrency(lastPremium.monthly)]);

  doc.setFontSize(10);
  let y = 104;
  rows.forEach(([label, value]) => {
    renderKeyValue(doc, label, value, y);
    y += 8;
  });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 165, 195, 165);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 100, 113);
  doc.text(
    "This quote is an estimate. Final premiums and fees are subject to verification and approval.",
    15,
    172,
    { maxWidth: 180 }
  );

  doc.save("Premium_Quote.pdf");
}

function calculateRegistration() {
  const data = {
    name: document.getElementById("name").value || "N/A",
    sale: document.getElementById("sale").value,
    price: parseFloat(document.getElementById("price").value) || 0,
    value: parseFloat(document.getElementById("value").value) || 0,
    plate: document.getElementById("plate").value,
    register: document.getElementById("register").value,
    policy: document.getElementById("policy").value,
  };

  const tax =
    data.sale === "Dealer Sale"
      ? data.price * 0.0625
      : data.sale === "Private Sale"
        ? Math.max(data.price, data.value) * 0.0625
        : 25;

  const total =
    tax +
    TITLE_FEE +
    (PLATES[data.plate] || 0) +
    (data.register === "Yes" ? AGENCY_FEES[data.policy] || 0 : 0);

  lastReg = { ...data, tax: tax.toFixed(2), total: total.toFixed(2) };

  const resultHTML =
    `Tax: $${lastReg.tax}\n` +
    `Title Fee: $${TITLE_FEE}\n` +
    `Plate Fee: $${PLATES[data.plate] || 0}\n` +
    `Agency Fee: $${data.register === "Yes" ? AGENCY_FEES[data.policy] || 0 : 0}\n` +
    `Total Due: $${lastReg.total}`;

  document.getElementById("regResult").textContent = resultHTML;
}

function generateRegistrationPDF() {
  if (!lastReg) {
    alert("Please calculate the registration first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  drawPdfHeader(doc, "A-Affordable Insurance", "Registration Quote");

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(12, 34, 186, 52, 4, 4, "F");

  doc.setFontSize(10);
  renderKeyValue(doc, "Customer", lastReg.name, 42);
  renderKeyValue(doc, "Sale Type", lastReg.sale, 50);
  renderKeyValue(doc, "Plate", lastReg.plate, 58);

  if (lastReg.register === "Yes") {
    renderKeyValue(doc, "Policy", lastReg.policy, 66);
    renderKeyValue(doc, "Registration", "Agency", 74);
  } else {
    renderKeyValue(doc, "Registration", "Self", 66);
  }

  renderKeyValue(doc, "Date", new Date().toLocaleDateString(), 82);

  doc.setFillColor(249, 250, 252);
  doc.roundedRect(12, 92, 186, 65, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Estimated Fees", 16, 104);

  const fees = [
    ["Tax", formatCurrency(lastReg.tax)],
    ["Title Fee", formatCurrency(TITLE_FEE)],
    ["Plate Fee", formatCurrency(PLATES[lastReg.plate] || 0)],
  ];

  if (lastReg.register === "Yes") {
    fees.push([
      "Agency Fee",
      formatCurrency(AGENCY_FEES[lastReg.policy] || 0)
    ]);
  }

  fees.push(["Total Due", formatCurrency(lastReg.total)]);

  doc.setFontSize(10);
  let y = 116;
  fees.forEach(([label, value]) => {
    renderKeyValue(doc, label, value, y);
    y += 8;
  });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 173, 195, 173);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 100, 113);
  doc.text(
    "Amounts are estimates only and may change after final agency review.",
    15,
    180,
    { maxWidth: 180 }
  );

  doc.save("Registration_Quote.pdf");
}

loadPlates();
handleSaleChange();
handleRegisterChange();
