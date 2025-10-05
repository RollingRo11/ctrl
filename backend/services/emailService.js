const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Generate PDF buffer for a document
async function generatePDFBuffer(investments, documentId, taxData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const currentYear = new Date().getFullYear();

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
  });
}

// Send email with tax documents
async function sendTaxDocuments(recipientEmail, investments, taxData, documents) {
  // For development, use Gmail SMTP with an app password
  // In production, use a service like SendGrid, AWS SES, or Mailgun

  // Check if email credentials are configured
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.log('⚠️  Email credentials not configured. Simulating email send...');
    console.log(`📧 Would send to: ${recipientEmail}`);
    console.log(`📄 Documents: ${documents.join(', ')}`);
    return {
      success: true,
      simulated: true,
      message: 'Email simulated (no credentials configured)'
    };
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });

    // Generate PDF attachments
    const attachments = [];
    for (const docId of documents) {
      const pdfBuffer = await generatePDFBuffer(investments, docId, taxData);
      const docNames = {
        '1099-div': 'Form-1099-DIV',
        '1099-b': 'Form-1099-B',
        'annual-summary': 'Annual-Tax-Summary'
      };

      attachments.push({
        filename: `${docNames[docId]}-${new Date().getFullYear()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"GPU Datacenter Investments" <${emailUser}>`,
      to: recipientEmail,
      subject: `Your ${new Date().getFullYear()} Tax Documents - GPU Datacenter Investments`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #a3e635; color: #000; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            ul { padding-left: 20px; }
            .summary { background: white; border-left: 4px solid #a3e635; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Your Tax Documents Are Ready</h1>
            </div>
            <div class="content">
              <p>Dear Investor,</p>

              <p>Your tax documents for the ${new Date().getFullYear()} tax year are attached to this email.</p>

              <div class="summary">
                <h3>📄 Included Documents:</h3>
                <ul>
                  ${documents.map(doc => {
                    const names = {
                      '1099-div': 'Form 1099-DIV (Dividend Income)',
                      '1099-b': 'Form 1099-B (Capital Gains/Losses)',
                      'annual-summary': 'Annual Tax Summary Report'
                    };
                    return `<li>${names[doc]}</li>`;
                  }).join('')}
                </ul>
              </div>

              <div class="summary">
                <h3>💰 Summary:</h3>
                <ul>
                  <li><strong>Total Investment Income:</strong> $${taxData.overview.totalInvestmentIncome.toFixed(2)}</li>
                  <li><strong>Total Dividends:</strong> $${taxData.overview.totalDividends.toFixed(2)}</li>
                  <li><strong>Estimated Tax Owed:</strong> $${taxData.overview.estimatedTaxOwed.toFixed(2)}</li>
                  ${taxData.overview.taxSavingsOpportunities > 0 ?
                    `<li><strong>Tax Savings Available:</strong> $${taxData.overview.taxSavingsOpportunities.toFixed(2)}</li>` :
                    ''
                  }
                </ul>
              </div>

              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Review the attached documents carefully</li>
                <li>Consult with your tax professional if needed</li>
                <li>File these with your ${new Date().getFullYear()} tax return</li>
              </ol>

              <p><em>⚠️ Important: These documents are for informational purposes only. Please consult with a qualified tax professional for personalized tax advice.</em></p>
            </div>
            <div class="footer">
              <p>GPU Datacenter Investment Platform<br>
              Generated on ${new Date().toLocaleString()}</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      simulated: false,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendTaxDocuments,
  generatePDFBuffer
};
