import { useState, useEffect } from "react";
import { useInvestments } from "../contexts/InvestmentContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Mail,
  Clock,
  Building2,
  Lightbulb,
  X,
  Info,
  Loader2,
  Calendar,
  Copy,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface TaxData {
  overview: {
    totalInvestmentIncome: number;
    totalDividends: number;
    estimatedTaxOwed: number;
    taxSavingsOpportunities: number;
    federalTax: number;
    stateTax: number;
  };
  capitalGains: Array<{
    id: string;
    project: string;
    costBasis: number;
    currentValue: number;
    gainLoss: number;
    term: string;
    taxRate: number;
    daysHeld: number;
    daysUntilLongTerm: number;
    estimatedDividends: number;
    taxAmount: number;
  }>;
  quarterlyPayments: Array<{
    quarter: string;
    date: string;
    amount: number;
    status: string;
    daysUntil: number | null;
  }>;
  deductions: {
    total: number;
    platformFees: number;
    advisoryFees: number;
  };
  incomeBreakdown: {
    dividends: number;
    capitalGains: number;
  };
  harvestingOpportunity: {
    available: boolean;
    amount?: number;
    taxSavings?: number;
    affectedInvestments?: any[];
  };
  hasInvestments: boolean;
}

const Financial = () => {
  const { investments } = useInvestments();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showHarvestingAlert, setShowHarvestingAlert] = useState(true);
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState<string | null>(null);

  // Fetch tax data when investments change
  useEffect(() => {
    const fetchTaxData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/financial/tax-summary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ investments }),
        });

        if (!response.ok) throw new Error("Failed to fetch tax data");

        const result = await response.json();
        setTaxData(result.data);
      } catch (error) {
        console.error("Error fetching tax data:", error);
        // Set empty data on error
        setTaxData({
          overview: {
            totalInvestmentIncome: 0,
            totalDividends: 0,
            estimatedTaxOwed: 0,
            taxSavingsOpportunities: 0,
            federalTax: 0,
            stateTax: 0,
          },
          capitalGains: [],
          quarterlyPayments: [],
          deductions: { total: 0, platformFees: 0, advisoryFees: 0 },
          incomeBreakdown: { dividends: 0, capitalGains: 0 },
          harvestingOpportunity: { available: false },
          hasInvestments: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTaxData();
  }, [investments]);

  const handleDownloadDocument = async (documentId: string, format: string = "pdf") => {
    try {
      const response = await fetch(`${API_URL}/api/financial/documents/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ investments, documentId, format }),
      });

      if (!response.ok) throw new Error("Failed to download document");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentId}-${selectedYear}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download document. Please try again.");
    }
  };

  const handleDownloadAll = async () => {
    await handleDownloadDocument("1099-div", "pdf");
    await handleDownloadDocument("1099-b", "pdf");
    await handleDownloadDocument("annual-summary", "pdf");
  };

  const handleSendToTurboTax = async () => {
    try {
      // Download TurboTax file format (.txf)
      await handleDownloadDocument("annual-summary", "txf");
      alert("TurboTax file downloaded! Open TurboTax and select 'Import' > 'From accounting software' and select the downloaded .txf file.");
    } catch (error) {
      console.error("Error sending to TurboTax:", error);
      alert("Failed to generate TurboTax file. Please try again.");
    }
  };

  const handleCopyEmailForCPA = () => {
    if (!taxData) return;

    const emailText = `Subject: Tax Documents for ${new Date().getFullYear()} - GPU Datacenter Investments

Dear [CPA Name],

I'm sending you my tax documents for the ${new Date().getFullYear()} tax year from my GPU datacenter investments.

INVESTMENT INCOME SUMMARY:
• Total Investment Income: $${taxData.overview.totalInvestmentIncome.toFixed(2)}
• Total Dividends: $${taxData.overview.totalDividends.toFixed(2)}
• Total Capital Gains: $${taxData.incomeBreakdown.capitalGains.toFixed(2)}

TAX LIABILITY:
• Federal Tax: $${taxData.overview.federalTax.toFixed(2)}
• State Tax: $${taxData.overview.stateTax.toFixed(2)}
• Total Estimated Tax Owed: $${taxData.overview.estimatedTaxOwed.toFixed(2)}

DEDUCTIONS:
• Platform Fees: $${taxData.deductions.platformFees.toFixed(2)}
• Advisory Fees: $${taxData.deductions.advisoryFees.toFixed(2)}
• Total Deductions: $${taxData.deductions.total.toFixed(2)}

INVESTMENT DETAILS:
${taxData.capitalGains.map(inv =>
  `• ${inv.project}: Cost $${inv.costBasis.toLocaleString()} → Current $${inv.currentValue.toLocaleString()} (${inv.gainLoss >= 0 ? '+' : ''}$${inv.gainLoss.toFixed(2)}, ${inv.term}-term, ${inv.daysHeld} days held)`
).join('\n')}

${taxData.overview.taxSavingsOpportunities > 0 ? `\nTAX OPTIMIZATION OPPORTUNITIES:
• Potential Tax Savings: $${taxData.overview.taxSavingsOpportunities.toFixed(2)}` : ''}

I've attached the following documents:
• Form 1099-DIV (Dividend Income)
• Form 1099-B (Capital Gains/Losses)
• Annual Tax Summary Report

Please let me know if you need any additional information.

Best regards`;

    navigator.clipboard.writeText(emailText).then(() => {
      alert("📋 Email text copied to clipboard!\n\nNow:\n1. Open your email client\n2. Paste the text (Cmd/Ctrl+V)\n3. Attach the downloaded tax documents\n4. Send to your CPA");
    }).catch(() => {
      alert("Failed to copy to clipboard. Please try again.");
    });
  };

  const handlePayQuarterly = async (quarter: string, amount: number) => {
    setPaymentProcessing(quarter);
    try {
      const response = await fetch(`${API_URL}/api/financial/payments/quarterly`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quarter, amount }),
      });

      if (!response.ok) throw new Error("Payment failed");

      const result = await response.json();
      alert(`Payment successful! Confirmation: ${result.payment.confirmationNumber}`);

      // Refresh tax data
      window.location.reload();
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setPaymentProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-terminal-accent animate-spin" />
      </div>
    );
  }

  if (!taxData || !taxData.hasInvestments) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Tax Center & Financial Reports</h1>
        <Card className="bg-terminal-surface border-terminal-border p-12">
          <div className="text-center space-y-4">
            <div className="text-terminal-muted text-lg">No investment data available</div>
            <p className="text-terminal-text">
              Make your first investment to see tax calculations and financial reports
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { overview, capitalGains, quarterlyPayments, deductions, incomeBreakdown, harvestingOpportunity } = taxData;

  // Pie chart data
  const incomeBreakdownData = [
    { name: "Dividend Income", value: incomeBreakdown.dividends, color: "#a3e635" },
    { name: "Capital Gains", value: incomeBreakdown.capitalGains, color: "#4ade80" },
  ].filter(item => item.value > 0);

  const getAlertColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "border-red-500/50 bg-red-500/10";
      case "success":
        return "border-terminal-accent/50 bg-terminal-accent/10";
      case "info":
        return "border-blue-500/50 bg-blue-500/10";
      case "warning":
        return "border-orange-500/50 bg-orange-500/10";
      default:
        return "border-terminal-border";
    }
  };

  const alerts = [
    // Urgent: Upcoming quarterly payment
    quarterlyPayments.find(p => p.status === "due" && p.daysUntil !== null && p.daysUntil < 30) && {
      type: "urgent",
      message: `Quarterly tax payment due in ${quarterlyPayments.find(p => p.status === "due")?.daysUntil} days ($${quarterlyPayments.find(p => p.status === "due")?.amount})`,
      detail: "Missing this deadline may result in penalties and interest charges",
      icon: Clock,
      action: "Pay Now",
    },
    // Tax-loss harvesting opportunity
    harvestingOpportunity.available && harvestingOpportunity.taxSavings && harvestingOpportunity.taxSavings > 0 && {
      type: "info",
      message: `Tax-loss harvesting available: Save $${harvestingOpportunity.taxSavings?.toFixed(2)} in taxes`,
      detail: `You can offset gains by harvesting $${harvestingOpportunity.amount?.toFixed(2)} in losses`,
      icon: Lightbulb,
      action: "Review Opportunity",
    },
    // Hold for long-term status
    capitalGains.some(inv => inv.term === "Short" && inv.daysUntilLongTerm < 100 && inv.gainLoss > 0) && {
      type: "info",
      message: `${capitalGains.find(inv => inv.term === "Short" && inv.daysUntilLongTerm < 100)?.project} becomes long-term in ${capitalGains.find(inv => inv.term === "Short" && inv.daysUntilLongTerm < 100)?.daysUntilLongTerm} days`,
      detail: `Save $${Math.round(capitalGains.find(inv => inv.term === "Short" && inv.daysUntilLongTerm < 100)!.gainLoss * 0.09)} by waiting for long-term capital gains rate (15% vs 24%)`,
      icon: TrendingUp,
      action: "View Timeline",
    },
    // Year-end tax planning
    new Date().getMonth() >= 10 && {
      type: "info",
      message: "Year-end tax planning: Consider strategic selling before Dec 31",
      detail: "Realize losses to offset gains, or delay sales to next year to defer taxes",
      icon: Calendar,
      action: "Plan Strategy",
    },
    // Tax forms ready
    {
      type: "success",
      message: `${new Date().getFullYear()} tax forms ready for download`,
      detail: "1099-DIV, 1099-B, and Annual Summary available",
      icon: FileText,
    },
    // Deductions available
    deductions.total > 0 && {
      type: "success",
      message: `$${deductions.total.toFixed(2)} in deductions identified`,
      detail: `Platform fees ($${deductions.platformFees.toFixed(2)}) and advisory fees ($${deductions.advisoryFees.toFixed(2)}) can reduce your tax liability`,
      icon: DollarSign,
    },
    // Maximum contribution limit approaching
    {
      type: "info",
      message: "Consider maximizing retirement account contributions before year-end",
      detail: "401(k) limit: $23,000 | IRA limit: $7,000 | HSA limit: $4,150 for 2024",
      icon: TrendingUp,
    },
    // Dividend reinvestment opportunity
    incomeBreakdown.dividends > 1000 && {
      type: "info",
      message: `$${incomeBreakdown.dividends.toLocaleString()} in dividends earned this year`,
      detail: "Consider reinvesting dividends to compound growth and potentially offset with harvested losses",
      icon: DollarSign,
    },
    // Quarterly estimated tax reminder
    quarterlyPayments.filter(p => p.status === "paid").length > 0 && {
      type: "success",
      message: `${quarterlyPayments.filter(p => p.status === "paid").length} quarterly payment${quarterlyPayments.filter(p => p.status === "paid").length > 1 ? 's' : ''} completed this year`,
      detail: "Stay on track to avoid underpayment penalties",
      icon: CheckCircle,
    },
    // Tax bracket optimization
    overview.estimatedTaxOwed > 5000 && {
      type: "info",
      message: "Consider income smoothing strategies to lower tax bracket",
      detail: "Timing capital gains realization or utilizing tax-advantaged accounts can reduce overall tax liability",
      icon: Lightbulb,
    },
    // Record keeping reminder
    {
      type: "info",
      message: "Keep detailed records of all investment transactions",
      detail: "IRS requires documentation for at least 3 years after filing",
      icon: FileText,
    },
    // Estimated tax warning
    overview.estimatedTaxOwed > 1000 && {
      type: "warning",
      message: `Estimated tax liability: $${overview.estimatedTaxOwed.toLocaleString()}`,
      detail: "Consider setting aside funds or adjusting withholdings to avoid year-end surprises",
      icon: AlertTriangle,
      action: "Review Payments",
    },
    // Investment performance alert
    capitalGains.some(inv => inv.gainLoss < 0) && {
      type: "warning",
      message: `${capitalGains.filter(inv => inv.gainLoss < 0).length} investment${capitalGains.filter(inv => inv.gainLoss < 0).length > 1 ? 's' : ''} currently at a loss`,
      detail: "Consider tax-loss harvesting before year-end to offset gains",
      icon: TrendingDown,
      action: "Review Positions",
    },
  ].filter(Boolean) as Array<{ type: string; message: string; detail?: string; icon: any; action?: string }>;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tax Center & Financial Reports</h1>
          <p className="text-terminal-text">Comprehensive tax reporting and optimization for your GPU investments</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-terminal-surface border border-terminal-border rounded-lg px-4 py-2 text-white"
        >
          <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
          <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
          <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
        </select>
      </div>

      {/* Tax Overview Dashboard - 4 Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-terminal-surface border-terminal-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-terminal-accent/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-terminal-accent" />
            </div>
            <div className="flex items-center text-terminal-success text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12%
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">${overview.totalInvestmentIncome.toLocaleString()}</div>
          <div className="text-terminal-text text-sm">Total Investment Income {selectedYear}</div>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex items-center text-terminal-success text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +8%
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">${overview.totalDividends.toLocaleString()}</div>
          <div className="text-terminal-text text-sm">Total Dividends Received</div>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex items-center text-orange-500 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +5%
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">${overview.estimatedTaxOwed.toLocaleString()}</div>
          <div className="text-terminal-text text-sm">Estimated Tax Owed</div>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-terminal-accent/20 rounded-lg">
              <Lightbulb className="w-6 h-6 text-terminal-accent" />
            </div>
            <div className="flex items-center text-terminal-success text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              New
            </div>
          </div>
          <div className="text-3xl font-bold text-terminal-accent mb-1">${overview.taxSavingsOpportunities.toLocaleString()}</div>
          <div className="text-terminal-text text-sm">Tax Savings Opportunities</div>
        </Card>
      </div>

      {/* Tax-Loss Harvesting Alert */}
      {showHarvestingAlert && harvestingOpportunity.available && harvestingOpportunity.amount && harvestingOpportunity.amount > 0 && (
        <Card className="bg-terminal-surface border-terminal-accent p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <Lightbulb className="w-5 h-5 text-terminal-accent mr-2" />
                <h3 className="text-xl font-bold text-terminal-accent">Tax Savings Opportunity Detected</h3>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-white">Harvesting losses could save you ${harvestingOpportunity.taxSavings?.toFixed(2)} in taxes</p>
                <p className="text-terminal-text">Realizing ${harvestingOpportunity.amount.toFixed(2)} in losses offsets your capital gains</p>
              </div>
              <div className="bg-terminal-bg rounded-lg p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-terminal-text">Total gains:</span>
                  <span className="text-white">
                    ${capitalGains.filter(inv => inv.gainLoss > 0).reduce((sum, inv) => sum + inv.gainLoss, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-terminal-text">Harvest loss:</span>
                  <span className="text-terminal-accent">-${harvestingOpportunity.amount.toFixed(2)} (saves ${harvestingOpportunity.taxSavings?.toFixed(2)})</span>
                </div>
                <div className="h-px bg-terminal-border my-2"></div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-white">Potential tax savings:</span>
                  <span className="text-terminal-accent">${harvestingOpportunity.taxSavings?.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-start space-x-2 text-sm text-yellow-500 mb-4">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Warning: Wash-sale rule applies. Cannot rebuy for 30 days.</p>
              </div>
              <div className="flex space-x-3">
                <Button className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90">
                  Review Opportunity
                </Button>
                <Button variant="outline" className="border-terminal-border text-white hover:bg-terminal-border">
                  Learn More
                </Button>
              </div>
            </div>
            <button onClick={() => setShowHarvestingAlert(false)} className="text-terminal-text hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </Card>
      )}

      {/* Capital Gains Table & Quarterly Payments */}
      <div className="grid grid-cols-5 gap-6">
        {/* Capital Gains Table - 60% */}
        <Card className="col-span-3 bg-terminal-surface border-terminal-border p-6">
          <h3 className="text-xl font-bold text-white mb-4">Capital Gains/Loss Tracker</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-terminal-border">
                  <th className="text-left py-3 px-2 text-terminal-text text-sm font-semibold">Project</th>
                  <th className="text-right py-3 px-2 text-terminal-text text-sm font-semibold">Cost Basis</th>
                  <th className="text-right py-3 px-2 text-terminal-text text-sm font-semibold">Current Value</th>
                  <th className="text-right py-3 px-2 text-terminal-text text-sm font-semibold">Gain/Loss</th>
                  <th className="text-center py-3 px-2 text-terminal-text text-sm font-semibold">Term</th>
                  <th className="text-center py-3 px-2 text-terminal-text text-sm font-semibold">Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                {capitalGains.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    className={`border-b border-terminal-border/50 hover:bg-terminal-bg cursor-pointer transition-colors ${
                      idx % 2 === 1 ? "bg-terminal-bg/30" : ""
                    }`}
                  >
                    <td className="py-4 px-2 text-white">{inv.project}</td>
                    <td className="py-4 px-2 text-right text-white">${inv.costBasis.toLocaleString()}</td>
                    <td className="py-4 px-2 text-right text-white">${inv.currentValue.toLocaleString()}</td>
                    <td
                      className={`py-4 px-2 text-right font-semibold ${
                        inv.gainLoss > 0 ? "text-terminal-success" : "text-red-500"
                      }`}
                    >
                      {inv.gainLoss > 0 ? "+" : ""}${inv.gainLoss.toLocaleString()}
                    </td>
                    <td className="py-4 px-2 text-center">
                      {inv.term === "Long" ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
                          Long-term ✓
                        </Badge>
                      ) : inv.daysUntilLongTerm < 100 ? (
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                          {inv.daysUntilLongTerm}d until long-term
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">
                          Short-term
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-2 text-center text-white">
                      {inv.taxRate > 0 ? (
                        <span className={inv.term === "Long" ? "text-terminal-success" : ""}>{inv.taxRate}%</span>
                      ) : (
                        <span className="text-terminal-text">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quarterly Payments - 40% */}
        <Card className="col-span-2 bg-terminal-surface border-terminal-border p-6">
          <h3 className="text-xl font-bold text-white mb-4">Quarterly Estimated Tax Payments</h3>
          <div className="space-y-4">
            {quarterlyPayments.map((payment, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  payment.status === "paid"
                    ? "bg-terminal-bg border-terminal-border"
                    : "bg-orange-500/10 border-orange-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold">{payment.quarter}</span>
                    <span className="text-terminal-text text-sm">({payment.date})</span>
                  </div>
                  {payment.status === "paid" ? (
                    <CheckCircle className="w-5 h-5 text-terminal-success" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">${payment.amount}</span>
                  {payment.status === "paid" ? (
                    <Badge className="bg-terminal-success/20 text-terminal-success border-terminal-success/50">
                      Paid
                    </Badge>
                  ) : (
                    <div className="text-right">
                      {payment.daysUntil !== null && (
                        <div className="text-orange-500 text-sm font-semibold mb-1">Due in {payment.daysUntil} days</div>
                      )}
                      <Button
                        size="sm"
                        className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
                        onClick={() => handlePayQuarterly(payment.quarter, payment.amount)}
                        disabled={paymentProcessing === payment.quarter}
                      >
                        {paymentProcessing === payment.quarter ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Pay Now"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-terminal-bg rounded-lg border border-terminal-border">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-terminal-accent mt-0.5 flex-shrink-0" />
              <p className="text-xs text-terminal-text">
                Based on your current income: ${overview.totalInvestmentIncome.toLocaleString()} × 24% tax rate ÷ 4 quarters
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tax Documents & Year-End Summary */}
      <div className="grid grid-cols-2 gap-6">
        {/* Tax Document Center */}
        <Card className="bg-terminal-surface border-terminal-border p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-terminal-accent mr-2" />
            <h3 className="text-xl font-bold text-white">{selectedYear} Tax Documents Ready</h3>
            <CheckCircle className="w-5 h-5 text-terminal-success ml-2" />
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-terminal-accent" />
                <div>
                  <div className="text-white font-semibold">Form 1099-DIV</div>
                  <div className="text-xs text-terminal-text">Dividends - All projects</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-terminal-accent hover:text-terminal-accent/80"
                onClick={() => handleDownloadDocument("1099-div")}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-terminal-accent" />
                <div>
                  <div className="text-white font-semibold">Form 1099-B</div>
                  <div className="text-xs text-terminal-text">Capital Gains/Losses</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-terminal-accent hover:text-terminal-accent/80"
                onClick={() => handleDownloadDocument("1099-b")}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-terminal-accent" />
                <div>
                  <div className="text-white font-semibold">Annual Summary Report</div>
                  <div className="text-xs text-terminal-text">Complete investment overview</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-terminal-accent hover:text-terminal-accent/80"
                onClick={() => handleDownloadDocument("annual-summary")}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
                onClick={handleDownloadAll}
              >
                <Download className="w-4 h-4 mr-2" />
                Download All (PDF)
              </Button>
              <Button
                variant="outline"
                className="border-terminal-border text-white hover:bg-terminal-border"
                onClick={handleCopyEmailForCPA}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Email for CPA
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full text-terminal-text hover:text-white"
              onClick={() => handleDownloadDocument("annual-summary", "csv")}
            >
              Export CSV
            </Button>
          </div>
          <div className="mt-4 text-xs text-terminal-text text-center">
            Generated on {new Date().toLocaleDateString()} • IRS-ready ✓
          </div>
        </Card>

        {/* Year-End Summary */}
        <Card className="bg-terminal-surface border-terminal-border p-6">
          <h3 className="text-xl font-bold text-white mb-4">Year-End Tax Summary</h3>
          {incomeBreakdownData.length > 0 && (
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incomeBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend
                    wrapperStyle={{ color: "#fff" }}
                    formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-3">
            <div className="p-3 bg-terminal-bg rounded-lg border border-terminal-border">
              <div className="text-sm text-terminal-text mb-1">Total Income</div>
              <div className="text-2xl font-bold text-white">${overview.totalInvestmentIncome.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-terminal-bg rounded-lg border border-terminal-border">
              <div className="text-sm text-terminal-text mb-2">Tax Breakdown</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-white">
                  <span>Federal Tax:</span>
                  <span>${overview.federalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>State Tax:</span>
                  <span>${overview.stateTax.toLocaleString()}</span>
                </div>
                <div className="h-px bg-terminal-border my-2"></div>
                <div className="flex justify-between text-orange-500 font-semibold">
                  <span>Total:</span>
                  <span>${overview.estimatedTaxOwed.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-terminal-accent/10 rounded-lg border border-terminal-accent/50">
              <div className="text-sm text-terminal-text mb-1">Deductions Identified</div>
              <div className="text-2xl font-bold text-terminal-accent mb-2">${deductions.total.toLocaleString()}</div>
              <div className="text-xs text-terminal-text space-y-1">
                <div className="flex justify-between">
                  <span>Platform fees:</span>
                  <span>${deductions.platformFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Investment advisory:</span>
                  <span>${deductions.advisoryFees.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {overview.taxSavingsOpportunities > 0 && (
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/50">
                <div className="text-xl font-bold text-terminal-success">${overview.taxSavingsOpportunities.toLocaleString()} available</div>
                <div className="text-xs text-terminal-text">in tax optimization opportunities</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Holding Period Optimizer */}
      <Card className="bg-terminal-surface border-terminal-border p-6">
        <h3 className="text-xl font-bold text-white mb-4">Holding Period Optimizer</h3>
        <div className="space-y-6">
          {capitalGains.map((inv, idx) => (
            <div key={inv.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white font-semibold">{inv.project}</div>
                  {inv.term === "Short" && inv.gainLoss > 0 && (
                    <div className="text-sm text-terminal-text">
                      {inv.daysUntilLongTerm} days until long-term (Save $
                      {Math.round(inv.gainLoss * (0.24 - 0.15))} in taxes)
                    </div>
                  )}
                  {inv.term === "Long" && <div className="text-sm text-terminal-success">Long-term status ✓</div>}
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{inv.daysHeld} days held</div>
                  {inv.term === "Short" && (
                    <div className="text-sm text-terminal-text">
                      Hold until:{" "}
                      {new Date(Date.now() + inv.daysUntilLongTerm * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative w-full h-3 bg-terminal-bg rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    inv.term === "Long" ? "bg-terminal-success" : "bg-terminal-accent"
                  }`}
                  style={{ width: `${Math.min((inv.daysHeld / 365) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-terminal-text mt-1">
                <span>0 days</span>
                <span>365 days (long-term)</span>
              </div>
            </div>
          ))}
        </div>
        {capitalGains.some(inv => inv.term === "Short" && inv.gainLoss > 0) && (
          <div className="mt-6 p-4 bg-terminal-accent/10 rounded-lg border border-terminal-accent/50">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-terminal-accent" />
              <div>
                <div className="text-white font-semibold">
                  Hold investments longer to save on taxes
                </div>
                <div className="text-sm text-terminal-text">
                  Potential savings: ${capitalGains
                    .filter(inv => inv.term === "Short" && inv.gainLoss > 0)
                    .reduce((sum, inv) => sum + Math.round(inv.gainLoss * (0.24 - 0.15)), 0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Alerts & Bank Connection */}
      <div className="grid grid-cols-2 gap-6">
        {/* Alerts */}
        <Card className="bg-terminal-surface border-terminal-border p-6">
          <h3 className="text-xl font-bold text-white mb-4">Smart Alerts & Notifications</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <alert.icon
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        alert.type === "urgent"
                          ? "text-red-500"
                          : alert.type === "success"
                          ? "text-terminal-accent"
                          : alert.type === "warning"
                          ? "text-orange-500"
                          : "text-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold mb-1">{alert.message}</p>
                      {alert.detail && (
                        <p className="text-terminal-text text-xs">{alert.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tax Bracket Calculator */}
        <Card className="bg-terminal-surface border-terminal-border p-6">
          <h3 className="text-xl font-bold text-white mb-4">Tax Bracket Calculator</h3>
          <div className="space-y-4">
            <div className="p-4 bg-terminal-bg rounded-lg border border-terminal-border">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-terminal-text">Current bracket:</span>
                  <span className="text-white font-semibold text-xl">24%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-terminal-text">Investment income:</span>
                  <span className="text-white">${overview.totalInvestmentIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-terminal-text">Total income (est):</span>
                  <span className="text-white">$85,000</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-terminal-accent/10 rounded text-sm text-terminal-text">
                You're $15K away from the next bracket (32%)
              </div>
            </div>

            {/* Tax Optimization Strategies */}
            <div>
              <h4 className="text-white font-semibold mb-3">Tax Optimization Strategies</h4>
              <div className="space-y-3">
                <div className="p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-terminal-accent/20 rounded-lg flex items-center justify-center mr-3">
                      <Clock className="w-4 h-4 text-terminal-accent" />
                    </div>
                    <h5 className="text-white font-semibold text-sm">Hold for Long-Term Rates</h5>
                  </div>
                  <p className="text-terminal-text text-xs">
                    Holding short-term investments longer can reduce your tax rate from 24% to 15%
                  </p>
                </div>

                {harvestingOpportunity.available && harvestingOpportunity.taxSavings && harvestingOpportunity.taxSavings > 0 && (
                  <div className="p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                        <TrendingDown className="w-4 h-4 text-orange-500" />
                      </div>
                      <h5 className="text-white font-semibold text-sm">Tax-Loss Harvesting</h5>
                    </div>
                    <p className="text-terminal-text text-xs mb-1">
                      Harvest losses to offset gains
                    </p>
                    <div className="text-terminal-accent font-semibold text-xs">
                      Potential savings: ${harvestingOpportunity.taxSavings.toFixed(2)}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <h5 className="text-white font-semibold text-sm">Qualified Dividend Planning</h5>
                  </div>
                  <p className="text-terminal-text text-xs">
                    85% of your dividends qualify for lower 15% rate ✓
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Export & Integration Options */}
      <Card className="bg-terminal-surface border-terminal-border p-6">
        <h3 className="text-xl font-bold text-white mb-4">Export & Integration Options</h3>
        <div className="grid grid-cols-5 gap-4">
          <Button
            className="bg-terminal-bg border border-terminal-border text-white hover:bg-terminal-border"
            onClick={() => handleDownloadDocument("annual-summary", "txf")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export for TurboTax (.txf)
          </Button>
          <Button
            className="bg-terminal-bg border border-terminal-border text-white hover:bg-terminal-border"
            onClick={() => handleDownloadDocument("annual-summary", "csv")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export for H&R Block (.csv)
          </Button>
          <Button
            className="bg-terminal-bg border border-terminal-border text-white hover:bg-terminal-border"
            onClick={() => alert("QuickBooks integration coming soon! For now, export as CSV and import into QuickBooks manually.")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            QuickBooks Integration
          </Button>
          <Button
            className="bg-terminal-bg border border-terminal-border text-white hover:bg-terminal-border"
            onClick={() => handleDownloadDocument("annual-summary", "pdf")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Download PDF Report
          </Button>
          <Button
            className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
            onClick={handleCopyEmailForCPA}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Email for CPA
          </Button>
        </div>
        <div className="mt-4 text-xs text-terminal-text">
          All exports include: transaction history, cost basis details, dividend records, and year-end tax summary
        </div>
      </Card>
    </div>
  );
};

export default Financial;
