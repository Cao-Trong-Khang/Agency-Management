require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const AgencyType = require("./models/AgencyType");
const Product = require("./models/Product");
const SystemRegulation = require("./models/SystemRegulation");
const Agency = require("./models/Agency");
const ExportReceipt = require("./models/ExportReceipt");
const PaymentReceipt = require("./models/PaymentReceipt");
const DebtHistory = require("./models/DebtHistory");

const bcrypt = require("bcryptjs");

const generateCode = (prefix, date, seq) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hex = seq.toString(16).padStart(6, "0").toUpperCase();
  return `${prefix}-${y}${m}${d}-${hex}`;
};

const seedBenchmark = async () => {
  console.log("==================================================");
  console.log("BENCHMARK DATASET GENERATION");
  console.log("==================================================");

  await connectDB();

  // Safety confirmation: Verify target database is development / local
  const dbName = mongoose.connection.name;
  const dbHost = mongoose.connection.host;
  console.log(`Connected to Target Database: [${dbName}] on host [${dbHost}]`);

  if (!dbName || dbName.includes("prod") || dbHost.includes("production")) {
    console.error("[CRITICAL ERROR] Target appears to be production! Aborting immediately.");
    process.exit(1);
  }

  console.log("\n[1/6] Cleaning up all existing documents in target database...");
  await Promise.all([
    User.deleteMany({}),
    AgencyType.deleteMany({}),
    Product.deleteMany({}),
    SystemRegulation.deleteMany({}),
    Agency.deleteMany({}),
    ExportReceipt.deleteMany({}),
    PaymentReceipt.deleteMany({}),
    DebtHistory.deleteMany({})
  ]);
  console.log("All collections cleared successfully.");

  console.log("\n[2/6] Seeding Users, SystemRegulation, AgencyTypes, and Products...");
  const hashedPassword = await bcrypt.hash("123456", 10);
  const users = await User.create([
    { fullName: "Administrator", email: "admin@gmail.com", passwordHash: hashedPassword, role: "admin" },
    { fullName: "Senior Staff", email: "staff@gmail.com", passwordHash: hashedPassword, role: "staff" },
    { fullName: "Operations Manager", email: "manager@gmail.com", passwordHash: hashedPassword, role: "admin" },
    { fullName: "Sales Representative 1", email: "sale1@gmail.com", passwordHash: hashedPassword, role: "staff" },
    { fullName: "Sales Representative 2", email: "sale2@gmail.com", passwordHash: hashedPassword, role: "staff" }
  ]);
  const defaultStaffId = users[1]._id;

  const regulation = await SystemRegulation.create({
    maxDistrict: 20,
    maxAgencyPerDistrict: 10
  });

  const agencyTypes = await AgencyType.create([
    { name: "Type 1 (VIP)", maxDebt: 50000000 },       // 50M VND
    { name: "Type 2 (Standard)", maxDebt: 30000000 },  // 30M VND
    { name: "Type 3 (New)", maxDebt: 15000000 }        // 15M VND
  ]);

  const productsData = [
    { name: "Coca Cola Lon 330ml", unit: "Thùng 24 lon", unitPrice: 210000 },
    { name: "Pepsi Cola Lon 330ml", unit: "Thùng 24 lon", unitPrice: 200000 },
    { name: "Bia Heineken Silver", unit: "Thùng 24 lon", unitPrice: 420000 },
    { name: "Bia Tiger Crystal", unit: "Thùng 24 lon", unitPrice: 380000 },
    { name: "Nước tăng lực Red Bull", unit: "Thùng 24 lon", unitPrice: 260000 },
    { name: "Nước tăng lực Sting Dâu", unit: "Thùng 24 chai", unitPrice: 190000 },
    { name: "Trà xanh Không Độ", unit: "Thùng 24 chai", unitPrice: 180000 },
    { name: "Trà Ô Long TEA+ Plus", unit: "Thùng 24 chai", unitPrice: 215000 },
    { name: "Nước khoáng Lavie 500ml", unit: "Thùng 24 chai", unitPrice: 110000 },
    { name: "Nước tinh khiết Aquafina", unit: "Thùng 24 chai", unitPrice: 115000 },
    { name: "Sữa tươi Vinamilk 100%", unit: "Thùng 48 hộp", unitPrice: 360000 },
    { name: "Cà phê lon Highlands Coffee", unit: "Thùng 24 lon", unitPrice: 320000 }
  ];
  const products = await Product.create(productsData);

  console.log(`Created: ${users.length} users, 1 regulation, ${agencyTypes.length} agency types, ${products.length} products.`);

  console.log("\n[3/6] Generating 100 Agencies across 15 Districts...");
  const districts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const agencyDocs = [];
  const agencyNames = [
    "Minh Phát", "Thành Đạt", "Hoàng Kim", "Đại Nam", "Hưng Thịnh",
    "Phú Quý", "Gia Hưng", "An Phát", "Vạn Lợi", "Bảo Long",
    "Tân Phát", "Đức Trí", "Phúc An", "Việt Thắng", "Thuận Phát",
    "Hải Đăng", "Quang Minh", "Toàn Thắng", "Tấn Phát", "Thịnh Vượng"
  ];
  const streetNames = [
    "Nguyễn Huệ", "Lê Lợi", "Hai Bà Trưng", "Trần Hưng Đạo", "Nguyễn Thị Minh Khai",
    "Điện Biên Phủ", "Cách Mạng Tháng 8", "Võ Văn Kiệt", "Phạm Văn Đồng", "Lê Văn Việt"
  ];

  let agencyCount = 0;
  for (const d of districts) {
    const agenciesInDistrict = 6 + (d % 3); // 6 to 8 agencies per district (<= 10)
    for (let i = 0; i < agenciesInDistrict; i++) {
      agencyCount++;
      const nameIndex = (agencyCount - 1) % agencyNames.length;
      const typeIndex = (agencyCount - 1) % agencyTypes.length;
      const selectedType = agencyTypes[typeIndex];

      // Receipt date between Jan 2025 and Jan 2026
      const receiptMonth = 1 + (agencyCount % 12);
      const receiptDay = 1 + (agencyCount % 28);
      const receiptDate = new Date(`2025-${String(receiptMonth).padStart(2, "0")}-${String(receiptDay).padStart(2, "0")}`);

      agencyDocs.push({
        _id: new mongoose.Types.ObjectId(),
        name: `Đại Lý ${agencyNames[nameIndex]} ${agencyCount}`,
        typeId: selectedType._id,
        phone: `090${String(1000000 + agencyCount).slice(1)}`,
        email: `agency${agencyCount}@agencynetwork.vn`,
        address: `${10 + (agencyCount * 3)} ${streetNames[agencyCount % streetNames.length]}, Phường ${1 + (agencyCount % 10)}, Quận ${d}`,
        district: d,
        receiptDate: receiptDate,
        currentDebt: 0
      });

      if (agencyCount >= 100) break;
    }
    if (agencyCount >= 100) break;
  }

  const createdAgencies = await Agency.insertMany(agencyDocs);
  console.log(`Created ${createdAgencies.length} agencies.`);

  console.log("\n[4/6] Simulating Chronological Transactions (Export, Payment, DebtHistory)...");
  // Transaction timeline: 2026-01-05 to 2026-11-12 (~310 days)
  // Current benchmark reference date: 2026-11-13
  const startDateEpoch = new Date("2026-01-05T08:00:00Z").getTime();
  const endDateEpoch = new Date("2026-11-12T17:00:00Z").getTime();
  const timeSpan = endDateEpoch - startDateEpoch;

  const exportReceiptsBatch = [];
  const paymentReceiptsBatch = [];
  const debtHistoriesBatch = [];

  let exportSeq = 1;
  let paymentSeq = 1;

  // We assign target debt risk profile to agencies to ensure realistic distribution:
  // - 20% High Risk (ending debt >= 90% of maxDebt)
  // - 30% Warning (ending debt >= 70% and < 90% of maxDebt)
  // - 50% Normal (ending debt < 70% of maxDebt)

  const agencyDebtUpdates = [];

  for (let aIdx = 0; aIdx < createdAgencies.length; aIdx++) {
    const agency = createdAgencies[aIdx];
    const agencyType = agencyTypes.find(t => String(t._id) === String(agency.typeId));
    const maxAllowedDebt = agencyType.maxDebt;

    // Target profile for this agency
    let targetDebtRatio;
    if (aIdx % 10 < 2) {
      targetDebtRatio = 0.91 + (Math.random() * 0.07); // 91% - 98% (High risk)
    } else if (aIdx % 10 < 5) {
      targetDebtRatio = 0.72 + (Math.random() * 0.15); // 72% - 87% (Warning)
    } else {
      targetDebtRatio = 0.15 + (Math.random() * 0.50); // 15% - 65% (Normal)
    }
    const targetEndingDebt = Math.round(maxAllowedDebt * targetDebtRatio);

    // Number of transactions for this agency (between 80 and 100)
    const numTransactions = 80 + Math.floor(Math.random() * 21);
    let currentDebt = 0;

    for (let t = 0; t < numTransactions; t++) {
      // Linear progression of time with slight random jitter
      const progress = (t + Math.random()) / (numTransactions + 1);
      const txTime = new Date(startDateEpoch + (progress * timeSpan));

      // Decide whether to export or pay
      // Towards the end of the timeline, steer debt towards targetEndingDebt
      const isLastStep = (t >= numTransactions - 3);
      let isExport;

      if (isLastStep) {
        isExport = currentDebt < targetEndingDebt;
      } else {
        if (currentDebt > maxAllowedDebt * 0.85) {
          isExport = false; // Must pay when near ceiling
        } else if (currentDebt < maxAllowedDebt * 0.20) {
          isExport = true; // Must export when low
        } else {
          isExport = Math.random() < 0.62; // 62% export, 38% payment
        }
      }

      if (isExport) {
        // Generate export receipt with 1-4 items
        const numItems = 1 + Math.floor(Math.random() * 4);
        const receiptItems = [];
        let totalAmount = 0;

        for (let k = 0; k < numItems; k++) {
          const prod = products[(aIdx + t + k) % products.length];
          // Determine quantity such that export doesn't blow past ceiling
          const remainingRoom = Math.max(100000, maxAllowedDebt - currentDebt);
          const maxQty = Math.max(1, Math.min(10, Math.floor(remainingRoom / (prod.unitPrice * numItems))));
          const quantity = 1 + Math.floor(Math.random() * maxQty);
          const amount = quantity * prod.unitPrice;

          receiptItems.push({
            productId: prod._id,
            productName: prod.name,
            unit: prod.unit,
            quantity: quantity,
            unitPrice: prod.unitPrice,
            amount: amount
          });
          totalAmount += amount;
        }

        currentDebt += totalAmount;
        const receiptCode = generateCode("EX", txTime, exportSeq++);
        const receiptId = new mongoose.Types.ObjectId();

        exportReceiptsBatch.push({
          _id: receiptId,
          receiptCode: receiptCode,
          agencyId: agency._id,
          agencyName: agency.name,
          date: txTime,
          items: receiptItems,
          totalAmount: totalAmount,
          createdBy: defaultStaffId,
          createdAt: txTime,
          updatedAt: txTime
        });

        debtHistoriesBatch.push({
          _id: new mongoose.Types.ObjectId(),
          agencyId: agency._id,
          receiptType: "EXPORT",
          receiptId: receiptId,
          receiptCode: receiptCode,
          date: txTime,
          change: -totalAmount, // convention: export is negative change
          debtAfter: currentDebt,
          createdAt: txTime,
          updatedAt: txTime
        });
      } else {
        // Generate payment receipt
        // Amount paid cannot exceed currentDebt
        if (currentDebt <= 0) continue;

        let amountPaid;
        if (isLastStep) {
          amountPaid = Math.max(100000, currentDebt - targetEndingDebt);
          if (amountPaid > currentDebt) amountPaid = Math.round(currentDebt * 0.5);
        } else {
          const payRatio = 0.25 + (Math.random() * 0.45); // pay 25% - 70% of current debt
          amountPaid = Math.round(currentDebt * payRatio);
        }

        // Round to thousands
        amountPaid = Math.max(100000, Math.round(amountPaid / 1000) * 1000);
        if (amountPaid > currentDebt) amountPaid = currentDebt;

        currentDebt -= amountPaid;
        const receiptCode = generateCode("PAY", txTime, paymentSeq++);
        const receiptId = new mongoose.Types.ObjectId();

        paymentReceiptsBatch.push({
          _id: receiptId,
          receiptCode: receiptCode,
          agencyId: agency._id,
          agencyName: agency.name,
          date: txTime,
          amountPaid: amountPaid,
          items: [],
          createdBy: defaultStaffId,
          createdAt: txTime,
          updatedAt: txTime
        });

        debtHistoriesBatch.push({
          _id: new mongoose.Types.ObjectId(),
          agencyId: agency._id,
          receiptType: "PAYMENT",
          receiptId: receiptId,
          receiptCode: receiptCode,
          date: txTime,
          change: +amountPaid, // convention: payment is positive change
          debtAfter: currentDebt,
          createdAt: txTime,
          updatedAt: txTime
        });
      }
    }

    agencyDebtUpdates.push({
      updateOne: {
        filter: { _id: agency._id },
        update: { $set: { currentDebt: currentDebt } }
      }
    });
  }

  console.log(`Prepared batches:`);
  console.log(`- Export Receipts: ${exportReceiptsBatch.length}`);
  console.log(`- Payment Receipts: ${paymentReceiptsBatch.length}`);
  console.log(`- Debt Histories:  ${debtHistoriesBatch.length}`);

  console.log("\n[5/6] Inserting documents in batches to MongoDB...");
  const BATCH_SIZE = 1000;

  for (let i = 0; i < exportReceiptsBatch.length; i += BATCH_SIZE) {
    await ExportReceipt.insertMany(exportReceiptsBatch.slice(i, i + BATCH_SIZE));
  }
  console.log("-> Export receipts inserted.");

  for (let i = 0; i < paymentReceiptsBatch.length; i += BATCH_SIZE) {
    await PaymentReceipt.insertMany(paymentReceiptsBatch.slice(i, i + BATCH_SIZE));
  }
  console.log("-> Payment receipts inserted.");

  for (let i = 0; i < debtHistoriesBatch.length; i += BATCH_SIZE) {
    await DebtHistory.insertMany(debtHistoriesBatch.slice(i, i + BATCH_SIZE));
  }
  console.log("-> Debt history records inserted.");

  await Agency.bulkWrite(agencyDebtUpdates);
  console.log("-> Agency currentDebt balances synchronized.");

  console.log("\n[6/6] Verifying Data Consistency and Generating Report Statistics...");
  const [
    userCount,
    agencyCountFinal,
    agencyTypeCount,
    productCount,
    regulationCount,
    exportCount,
    paymentCount,
    debtHistoryCount
  ] = await Promise.all([
    User.countDocuments(),
    Agency.countDocuments(),
    AgencyType.countDocuments(),
    Product.countDocuments(),
    SystemRegulation.countDocuments(),
    ExportReceipt.countDocuments(),
    PaymentReceipt.countDocuments(),
    DebtHistory.countDocuments()
  ]);

  console.log("==================================================");
  console.log("INSERTION SUMMARY REPORT");
  console.log("==================================================");
  console.log(`Users:               ${userCount}`);
  console.log(`Agency Types:        ${agencyTypeCount}`);
  console.log(`System Regulations:  ${regulationCount}`);
  console.log(`Products:            ${productCount}`);
  console.log(`Agencies:            ${agencyCountFinal}`);
  console.log(`Export Receipts:     ${exportCount}`);
  console.log(`Payment Receipts:    ${paymentCount}`);
  console.log(`Debt Histories:      ${debtHistoryCount}`);
  console.log(`TOTAL DOCUMENTS:     ${userCount + agencyTypeCount + regulationCount + productCount + agencyCountFinal + exportCount + paymentCount + debtHistoryCount}`);
  console.log("==================================================");

  // Quick verification query on Debt Report
  const sampleDebt = await DebtHistory.findOne().sort({ date: -1 });
  console.log(`Latest DebtHistory record date: ${sampleDebt.date.toISOString()}, debtAfter: ${sampleDebt.debtAfter}`);

  console.log("\nSeed benchmark dataset completed successfully!");
  process.exit(0);
};

seedBenchmark().catch((err) => {
  console.error("FATAL ERROR during benchmark seeding:", err);
  process.exit(1);
});
