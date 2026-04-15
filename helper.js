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

  if (!premium || isNaN(dpPercent) || term < 6 || term > 12) {
    alert(
      "Please enter valid numbers for premium, downpayment, and term (6-12 months).",
    );
    return;
  }

  const downPay = (premium * dpPercent) / 100;
  const remaining = premium - downPay;
  const monthly = remaining / term;

  const resultHTML =
    `Premium: $${premium.toFixed(2)}\n` +
    `Downpayment: $${downPay.toFixed(2)}\n` +
    `Remaining Balance: $${remaining.toFixed(2)}\n` +
    `Monthly Payment: $${monthly.toFixed(2)}\n` +
    `Company: ${companySelect.value}\n` +
    `Term: ${term} months`;

  document.getElementById("premiumResult").textContent = resultHTML;

  lastPremium = {
    premium,
    downPay,
    dpPercent,
    remaining,
    term,
    monthly,
    customer: document.getElementById("customer").value || "N/A",
    company: companySelect.value,
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

function generatePremiumPDF() {
  if (!lastPremium) {
    alert("Please calculate the premium first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("A-Affordable Insurance", 105, 14, { align: "center" });
  doc.setTextColor(0, 0, 0);

  let y = 35;
  const line = (text, size = 11, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(text, 15, y);
    y += 7;
  };

  line("Premium Quote", 14, true);
  y += 5;
  line("Customer: " + lastPremium.customer);
  line("Company: " + lastPremium.company);
  line("Date: " + new Date().toLocaleString());
  y += 8;

  line("Premium Breakdown", 13, true);
  line("Total Premium: $" + lastPremium.premium.toFixed(2));
  line("Downpayment: $" + lastPremium.downPay.toFixed(2));
  line("Remaining Balance: $" + lastPremium.remaining.toFixed(2));
  line(
    "Monthly Payment (" +
      lastPremium.term +
      " months): $" +
      lastPremium.monthly.toFixed(2),
  );
  line("Payment Terms: " + lastPremium.term + " months");

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const disclosure =
    "CONFIDENTIALITY NOTICE: This document is intended solely for the named recipient. Unauthorized distribution is prohibited.";
  const wrapped = doc.splitTextToSize(disclosure, 180);
  doc.text(wrapped, 15, 270);

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

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("A-Affordable Insurance", 105, 14, { align: "center" });
  doc.setTextColor(0, 0, 0);

  let y = 35;
  const line = (text, size = 11, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(text, 15, y);
    y += 7;
  };

  line("Registration Quote", 14, true);
  y += 5;
  line("Customer: " + lastReg.name);
  line("Sale Type: " + lastReg.sale);
  line("Plate: " + lastReg.plate);
  line("Date: " + new Date().toLocaleString());
  y += 8;

  line("Fees Breakdown", 13, true);
  line("Tax: $" + lastReg.tax);
  line("Title Fee: $" + TITLE_FEE);
  line("Plate Fee: $" + (PLATES[lastReg.plate] || 0));
  line(
    "Agency Fee: $" +
      (lastReg.register === "Yes" ? AGENCY_FEES[lastReg.policy] || 0 : 0),
  );
  line("Total: $" + lastReg.total);

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const disclosure =
    "CONFIDENTIALITY NOTICE: This document is intended solely for the named recipient. Unauthorized distribution is prohibited.";
  const wrapped = doc.splitTextToSize(disclosure, 180);
  doc.text(wrapped, 15, 270);

  doc.save("Registration_Quote.pdf");
}

loadPlates();
handleSaleChange();
handleRegisterChange();
