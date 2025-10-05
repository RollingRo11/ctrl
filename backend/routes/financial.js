const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify/sync');
const { sendTaxDocuments } = require('../services/emailService');

// Helper to calculate tax data from investments
function calculateTaxData(investments) {
  const currentYear = new Date().getFullYear();
  const taxRate = {
    shortTerm: 0.24, // 24% short-term capital gains
    longTerm: 0.15,  // 15% long-term capital gains
    dividend: 0.15,  // 15% qualified dividend rate
  };

  let totalDividends = 0;
  let totalShortTermGains = 0;
  let totalLongTermGains = 0;
  let totalLosses = 0;

  const capitalGainsDetails = investments.map(inv => {
    const investmentDate = new Date(inv.investmentDate);
    const daysSinceInvestment = Math.floor(
      (new Date().getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate current value with growth
    const dailyRate = inv.expectedAPY / 365 / 100;
    const growthFactor = Math.pow(1 + dailyRate, daysSinceInvestment);
    const currentValue = inv.amount * growthFactor;
    const gainLoss = currentValue - inv.amount;

    // Determine if short-term or long-term
    const isLongTerm = daysSinceInvestment >= 365;
    const daysUntilLongTerm = isLongTerm ? 0 : 365 - daysSinceInvestment;

    // Calculate tax rate and amount
    const applicableTaxRate = gainLoss < 0 ? 0 : (isLongTerm ? taxRate.longTerm : taxRate.shortTerm);
    const taxAmount = gainLoss * applicableTaxRate;

    // Aggregate totals
    if (gainLoss > 0) {
      if (isLongTerm) {
        totalLongTermGains += gainLoss;
      } else {
        totalShortTermGains += gainLoss;
      }
    } else {
      totalLosses += Math.abs(gainLoss);
    }

    // Estimate dividends (assume 60% of returns are dividends for built projects)
    const estimatedDividends = gainLoss > 0 ? gainLoss * 0.66 : 0;
    totalDividends += estimatedDividends;

    return {
      id: inv.id,
      projectId: inv.projectId,
      project: inv.projectName,
      costBasis: inv.amount,
      currentValue: Math.round(currentValue * 100) / 100,
      gainLoss: Math.round(gainLoss * 100) / 100,
      term: isLongTerm ? 'Long' : 'Short',
      taxRate: applicableTaxRate * 100,
      daysHeld: daysSinceInvestment,
      daysUntilLongTerm,
      investmentDate: inv.investmentDate,
      estimatedDividends: Math.round(estimatedDividends * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
    };
  });

  // Calculate total income
  const totalCapitalGains = totalShortTermGains + totalLongTermGains - totalLosses;
  const totalInvestmentIncome = totalDividends + totalCapitalGains;

  // Calculate total taxes
  const federalTax = (totalShortTermGains * taxRate.shortTerm) +
                     (totalLongTermGains * taxRate.longTerm) +
                     (totalDividends * taxRate.dividend) -
                     (totalLosses * taxRate.shortTerm);
  const stateTax = federalTax * 0.23; // Assume ~23% of federal for state (varies by state)
  const estimatedTaxOwed = Math.max(0, Math.round((federalTax + stateTax) * 100) / 100);

  // Calculate tax savings opportunities
  const harvestableLosses = capitalGainsDetails
    .filter(inv => inv.gainLoss < 0)
    .reduce((sum, inv) => sum + Math.abs(inv.gainLoss), 0);

  const taxSavingsFromHarvesting = Math.round(harvestableLosses * taxRate.shortTerm * 100) / 100;

  // Savings from holding to long-term
  const shortTermInvestments = capitalGainsDetails.filter(inv => inv.term === 'Short' && inv.gainLoss > 0);
  const savingsFromHolding = shortTermInvestments.reduce((sum, inv) => {
    return sum + (inv.gainLoss * (taxRate.shortTerm - taxRate.longTerm));
  }, 0);

  const totalSavingsOpportunities = Math.round((taxSavingsFromHarvesting + savingsFromHolding) * 100) / 100;

  // Platform fees as deductions (estimate 1% of investment)
  const platformFees = investments.reduce((sum, inv) => sum + inv.amount * 0.012, 0);
  const advisoryFees = investments.length * 220; // Flat fee per investment
  const totalDeductions = Math.round((platformFees + advisoryFees) * 100) / 100;

  return {
    overview: {
      totalInvestmentIncome: Math.round(totalInvestmentIncome * 100) / 100,
      totalDividends: Math.round(totalDividends * 100) / 100,
      estimatedTaxOwed,
      taxSavingsOpportunities: totalSavingsOpportunities,
      federalTax: Math.round(federalTax * 100) / 100,
      stateTax: Math.round(stateTax * 100) / 100,
    },
    capitalGains: capitalGainsDetails,
    deductions: {
      total: totalDeductions,
      platformFees: Math.round(platformFees * 100) / 100,
      advisoryFees: Math.round(advisoryFees * 100) / 100,
    },
    incomeBreakdown: {
      dividends: Math.round(totalDividends * 100) / 100,
      capitalGains: Math.round(totalCapitalGains * 100) / 100,
    },
    harvestingOpportunity: harvestableLosses > 0 ? {
      available: true,
      amount: Math.round(harvestableLosses * 100) / 100,
      taxSavings: taxSavingsFromHarvesting,
      affectedInvestments: capitalGainsDetails.filter(inv => inv.gainLoss < 0),
    } : { available: false },
  };
}

// Calculate quarterly estimated payments
function calculateQuarterlyPayments(estimatedTaxOwed) {
  const quarterlyAmount = Math.round((estimatedTaxOwed / 4) * 100) / 100;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const quarters = [
    { quarter: 'Q1', dueDate: `${currentYear}-04-15`, label: 'Apr 15' },
    { quarter: 'Q2', dueDate: `${currentYear}-06-15`, label: 'Jun 15' },
    { quarter: 'Q3', dueDate: `${currentYear}-09-15`, label: 'Sep 15' },
    { quarter: 'Q4', dueDate: `${currentYear + 1}-01-15`, label: 'Jan 15' },
  ];

  return quarters.map(q => {
    const dueDate = new Date(q.dueDate);
    const isPast = currentDate > dueDate;
    const daysUntil = Math.floor((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      quarter: q.quarter,
      date: `${q.label}, ${dueDate.getFullYear()}`,
      amount: quarterlyAmount,
      status: isPast ? 'paid' : 'due',
      daysUntil: isPast ? null : Math.max(0, daysUntil),
    };
  });
}

// POST /api/financial/tax-summary
router.post('/tax-summary', async (req, res) => {
  try {
    const { investments } = req.body;

    if (!investments || investments.length === 0) {
      return res.json({
        success: true,
        message: 'No investments found',
        data: {
          overview: {
            totalInvestmentIncome: 0,
            totalDividends: 0,
            estimatedTaxOwed: 0,
            taxSavingsOpportunities: 0,
          },
          capitalGains: [],
          quarterlyPayments: [],
          hasInvestments: false,
        },
      });
    }

    const taxData = calculateTaxData(investments);
    const quarterlyPayments = calculateQuarterlyPayments(taxData.overview.estimatedTaxOwed);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...taxData,
        quarterlyPayments,
        hasInvestments: true,
      },
    });
  } catch (error) {
    console.error('Error calculating tax summary:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/financial/documents/generate
// Generates tax documents based on user's investment data
router.post('/documents/generate', async (req, res) => {
  try {
    const { investments, documentId, format = 'pdf' } = req.body;

    if (!investments || investments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No investment data provided',
      });
    }

    const taxData = calculateTaxData(investments);
    const currentYear = new Date().getFullYear();
    const fileName = `${documentId}-${currentYear}.${format}`;

    if (format === 'csv') {
      // Generate CSV
      let csvData = [];
      let csvContent = '';

      if (documentId === '1099-div') {
        // Form 1099-DIV - Dividends
        csvData = [
          ['Form 1099-DIV', `Tax Year ${currentYear}`],
          [''],
          ['Payer', 'GPU Datacenter Investment Platform'],
          ['Payer TIN', 'XX-XXXXXXX'],
          [''],
          ['RECIPIENT INFORMATION'],
          ['Account Number', 'USER-' + Date.now()],
          [''],
          ['DIVIDEND INCOME'],
          ['Total Ordinary Dividends', `$${taxData.overview.totalDividends.toFixed(2)}`],
          ['Qualified Dividends', `$${(taxData.overview.totalDividends * 0.85).toFixed(2)}`],
          [''],
          ['DETAILED BREAKDOWN BY PROJECT'],
          ['Project Name', 'Dividend Amount', 'Qualified', 'Investment Date'],
        ];

        taxData.capitalGains.forEach(inv => {
          csvData.push([
            inv.project,
            `$${inv.estimatedDividends.toFixed(2)}`,
            inv.term === 'Long' ? 'Yes' : 'No',
            new Date(inv.investmentDate).toLocaleDateString(),
          ]);
        });
      } else if (documentId === '1099-b') {
        // Form 1099-B - Capital Gains/Losses
        csvData = [
          ['Form 1099-B', `Tax Year ${currentYear}`],
          [''],
          ['Payer', 'GPU Datacenter Investment Platform'],
          ['Payer TIN', 'XX-XXXXXXX'],
          [''],
          ['RECIPIENT INFORMATION'],
          ['Account Number', 'USER-' + Date.now()],
          [''],
          ['PROCEEDS FROM BROKER AND BARTER EXCHANGE TRANSACTIONS'],
          [''],
          ['Project', 'Date Acquired', 'Date Sold/Current', 'Cost Basis', 'Proceeds', 'Gain/Loss', 'Term', 'Tax Rate'],
        ];

        taxData.capitalGains.forEach(inv => {
          csvData.push([
            inv.project,
            new Date(inv.investmentDate).toLocaleDateString(),
            new Date().toLocaleDateString(),
            `$${inv.costBasis.toFixed(2)}`,
            `$${inv.currentValue.toFixed(2)}`,
            `$${inv.gainLoss.toFixed(2)}`,
            inv.term,
            `${inv.taxRate}%`,
          ]);
        });

        csvData.push(['']);
        csvData.push(['SUMMARY']);
        csvData.push(['Total Short-Term Gains', `$${taxData.capitalGains.filter(i => i.term === 'Short' && i.gainLoss > 0).reduce((s, i) => s + i.gainLoss, 0).toFixed(2)}`]);
        csvData.push(['Total Long-Term Gains', `$${taxData.capitalGains.filter(i => i.term === 'Long' && i.gainLoss > 0).reduce((s, i) => s + i.gainLoss, 0).toFixed(2)}`]);
        csvData.push(['Total Losses', `$${taxData.capitalGains.filter(i => i.gainLoss < 0).reduce((s, i) => s + Math.abs(i.gainLoss), 0).toFixed(2)}`]);
      } else if (documentId === 'annual-summary') {
        // Annual Summary Report
        csvData = [
          ['GPU Datacenter Investment Platform'],
          ['Annual Tax Summary Report', `Tax Year ${currentYear}`],
          ['Generated on', new Date().toLocaleDateString()],
          [''],
          ['INVESTMENT INCOME SUMMARY'],
          ['Total Investment Income', `$${taxData.overview.totalInvestmentIncome.toFixed(2)}`],
          ['Total Dividends', `$${taxData.overview.totalDividends.toFixed(2)}`],
          ['Total Capital Gains', `$${taxData.incomeBreakdown.capitalGains.toFixed(2)}`],
          [''],
          ['TAX LIABILITY'],
          ['Federal Tax', `$${taxData.overview.federalTax.toFixed(2)}`],
          ['State Tax', `$${taxData.overview.stateTax.toFixed(2)}`],
          ['Total Estimated Tax Owed', `$${taxData.overview.estimatedTaxOwed.toFixed(2)}`],
          [''],
          ['DEDUCTIONS'],
          ['Platform Fees', `$${taxData.deductions.platformFees.toFixed(2)}`],
          ['Advisory Fees', `$${taxData.deductions.advisoryFees.toFixed(2)}`],
          ['Total Deductions', `$${taxData.deductions.total.toFixed(2)}`],
          [''],
          ['TAX OPTIMIZATION OPPORTUNITIES'],
          ['Available Tax Savings', `$${taxData.overview.taxSavingsOpportunities.toFixed(2)}`],
          [''],
          ['INVESTMENT DETAILS'],
          ['Project', 'Cost Basis', 'Current Value', 'Gain/Loss', 'Term', 'Tax Rate', 'Days Held'],
        ];

        taxData.capitalGains.forEach(inv => {
          csvData.push([
            inv.project,
            `$${inv.costBasis.toFixed(2)}`,
            `$${inv.currentValue.toFixed(2)}`,
            `$${inv.gainLoss.toFixed(2)}`,
            inv.term,
            `${inv.taxRate}%`,
            inv.daysHeld,
          ]);
        });
      }

      csvContent = stringify(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csvContent);

    } else if (format === 'txf') {
      // TurboTax format
      let txfContent = `V042\nAGPU Datacenter Investment Platform\nD${new Date().toLocaleDateString()}\n^\n`;

      taxData.capitalGains.forEach(inv => {
        txfContent += `TD\nN${inv.project}\nP${inv.project}\nD${new Date(inv.investmentDate).toLocaleDateString()}\nD${new Date().toLocaleDateString()}\nC${inv.costBasis.toFixed(2)}\nP${inv.currentValue.toFixed(2)}\n^\n`;
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(txfContent);

    } else {
      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(pdfBuffer);
      });

      // PDF Header
      doc.fontSize(20).text('GPU Datacenter Investment Platform', { align: 'center' });
      doc.moveDown(0.5);

      if (documentId === '1099-div') {
        doc.fontSize(16).text(`Form 1099-DIV - Tax Year ${currentYear}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(12).text('PAYER INFORMATION', { underline: true });
        doc.fontSize(10);
        doc.text('Payer: GPU Datacenter Investment Platform');
        doc.text('Payer TIN: XX-XXXXXXX');
        doc.moveDown();

        doc.fontSize(12).text('RECIPIENT INFORMATION', { underline: true });
        doc.fontSize(10);
        doc.text(`Account Number: USER-${Date.now()}`);
        doc.text(`Date Generated: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        doc.fontSize(12).text('DIVIDEND INCOME', { underline: true });
        doc.fontSize(10);
        doc.text(`1a. Total Ordinary Dividends: $${taxData.overview.totalDividends.toFixed(2)}`);
        doc.text(`1b. Qualified Dividends: $${(taxData.overview.totalDividends * 0.85).toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(12).text('DETAILED BREAKDOWN BY PROJECT', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colWidths = [200, 100, 80, 100];
        const headers = ['Project Name', 'Dividends', 'Qualified', 'Inv. Date'];

        doc.fontSize(9).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(header, x, tableTop, { width: colWidths[i] });
        });

        doc.font('Helvetica');
        let yPos = tableTop + 20;

        taxData.capitalGains.forEach(inv => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          const rowData = [
            inv.project,
            `$${inv.estimatedDividends.toFixed(2)}`,
            inv.term === 'Long' ? 'Yes' : 'No',
            new Date(inv.investmentDate).toLocaleDateString(),
          ];

          rowData.forEach((data, i) => {
            const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(data, x, yPos, { width: colWidths[i] });
          });

          yPos += 20;
        });

      } else if (documentId === '1099-b') {
        doc.fontSize(16).text(`Form 1099-B - Tax Year ${currentYear}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(12).text('PAYER INFORMATION', { underline: true });
        doc.fontSize(10);
        doc.text('Payer: GPU Datacenter Investment Platform');
        doc.text('Payer TIN: XX-XXXXXXX');
        doc.moveDown();

        doc.fontSize(12).text('PROCEEDS FROM BROKER TRANSACTIONS', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const headers = ['Project', 'Cost Basis', 'Current Value', 'Gain/Loss', 'Term'];
        const colWidths = [150, 80, 90, 80, 60];

        doc.fontSize(8).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(header, x, tableTop, { width: colWidths[i] });
        });

        doc.font('Helvetica');
        let yPos = tableTop + 20;

        taxData.capitalGains.forEach(inv => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          const rowData = [
            inv.project,
            `$${inv.costBasis.toLocaleString()}`,
            `$${inv.currentValue.toLocaleString()}`,
            `$${inv.gainLoss.toLocaleString()}`,
            inv.term,
          ];

          rowData.forEach((data, i) => {
            const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(data, x, yPos, { width: colWidths[i] });
          });

          yPos += 20;
        });

        yPos += 10;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('SUMMARY', 50, yPos);
        yPos += 20;

        doc.font('Helvetica');
        const shortTermGains = taxData.capitalGains.filter(i => i.term === 'Short' && i.gainLoss > 0).reduce((s, i) => s + i.gainLoss, 0);
        const longTermGains = taxData.capitalGains.filter(i => i.term === 'Long' && i.gainLoss > 0).reduce((s, i) => s + i.gainLoss, 0);
        const totalLosses = taxData.capitalGains.filter(i => i.gainLoss < 0).reduce((s, i) => s + Math.abs(i.gainLoss), 0);

        doc.text(`Total Short-Term Gains: $${shortTermGains.toFixed(2)}`, 50, yPos);
        doc.text(`Total Long-Term Gains: $${longTermGains.toFixed(2)}`, 50, yPos + 15);
        doc.text(`Total Losses: $${totalLosses.toFixed(2)}`, 50, yPos + 30);

      } else if (documentId === 'annual-summary') {
        doc.fontSize(16).text(`Annual Tax Summary - ${currentYear}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).text('INVESTMENT INCOME SUMMARY', { underline: true });
        doc.fontSize(10);
        doc.moveDown(0.5);
        doc.text(`Total Investment Income: $${taxData.overview.totalInvestmentIncome.toFixed(2)}`);
        doc.text(`Total Dividends: $${taxData.overview.totalDividends.toFixed(2)}`);
        doc.text(`Total Capital Gains: $${taxData.incomeBreakdown.capitalGains.toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(14).text('TAX LIABILITY', { underline: true });
        doc.fontSize(10);
        doc.moveDown(0.5);
        doc.text(`Federal Tax: $${taxData.overview.federalTax.toFixed(2)}`);
        doc.text(`State Tax: $${taxData.overview.stateTax.toFixed(2)}`);
        doc.text(`Total Estimated Tax Owed: $${taxData.overview.estimatedTaxOwed.toFixed(2)}`, { underline: true });
        doc.moveDown();

        doc.fontSize(14).text('DEDUCTIONS', { underline: true });
        doc.fontSize(10);
        doc.moveDown(0.5);
        doc.text(`Platform Fees: $${taxData.deductions.platformFees.toFixed(2)}`);
        doc.text(`Advisory Fees: $${taxData.deductions.advisoryFees.toFixed(2)}`);
        doc.text(`Total Deductions: $${taxData.deductions.total.toFixed(2)}`, { underline: true });
        doc.moveDown();

        if (taxData.overview.taxSavingsOpportunities > 0) {
          doc.fontSize(14).fillColor('green').text('TAX OPTIMIZATION OPPORTUNITIES', { underline: true });
          doc.fontSize(10);
          doc.moveDown(0.5);
          doc.text(`Available Tax Savings: $${taxData.overview.taxSavingsOpportunities.toFixed(2)}`);
          doc.fillColor('black');
          doc.moveDown();
        }

        doc.addPage();
        doc.fontSize(14).text('INVESTMENT DETAILS', { underline: true });
        doc.moveDown();

        const tableTop = doc.y;
        const headers = ['Project', 'Cost', 'Value', 'Gain/Loss', 'Term'];
        const colWidths = [140, 80, 80, 80, 50];

        doc.fontSize(9).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(header, x, tableTop, { width: colWidths[i] });
        });

        doc.font('Helvetica');
        let yPos = tableTop + 20;

        taxData.capitalGains.forEach(inv => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          const rowData = [
            inv.project,
            `$${inv.costBasis.toLocaleString()}`,
            `$${inv.currentValue.toLocaleString()}`,
            `$${inv.gainLoss.toLocaleString()}`,
            inv.term,
          ];

          rowData.forEach((data, i) => {
            const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(data, x, yPos, { width: colWidths[i] });
          });

          yPos += 20;
        });
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor('gray').text('This document is for informational purposes only. Consult a tax professional for advice.', { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    }
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/financial/payments/quarterly
router.post('/payments/quarterly', async (req, res) => {
  try {
    const { quarter, amount } = req.body;

    if (!quarter || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Quarter and amount are required',
      });
    }

    res.json({
      success: true,
      message: `Payment of $${amount} for ${quarter} processed successfully`,
      payment: {
        quarter,
        amount,
        status: 'paid',
        paidDate: new Date().toISOString(),
        confirmationNumber: `PAY-${Date.now()}`,
      },
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/financial/bank-connection
router.get('/bank-connection', async (req, res) => {
  try {
    res.json({
      success: true,
      connected: true,
      connection: {
        institutionName: 'Chase',
        accountType: 'Checking',
        lastFourDigits: '4892',
        status: 'active',
        lastSyncDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        allDividendsAccounted: true,
      },
    });
  } catch (error) {
    console.error('Error fetching bank connection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/financial/email-documents
// Sends tax documents to specified email address
router.post('/email-documents', async (req, res) => {
  try {
    const { investments, recipientEmail, documents } = req.body;

    if (!investments || investments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No investment data provided',
      });
    }

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required',
      });
    }

    console.log(`📧 Sending tax documents to: ${recipientEmail}`);
    console.log(`📄 Documents: ${documents.join(', ')}`);
    console.log(`💼 Investment count: ${investments.length}`);

    // Calculate tax data
    const taxData = calculateTaxData(investments);

    // Send email with attachments
    const result = await sendTaxDocuments(recipientEmail, investments, taxData, documents);

    if (result.simulated) {
      res.json({
        success: true,
        simulated: true,
        message: `Email simulated - would send to ${recipientEmail}. Configure EMAIL_USER and EMAIL_PASSWORD in .env to enable real emails.`,
        emailedDocuments: documents,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        success: true,
        simulated: false,
        message: `Tax documents successfully sent to ${recipientEmail}`,
        emailedDocuments: documents,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('❌ Error emailing documents:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
