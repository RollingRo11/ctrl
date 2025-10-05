import { GoogleGenerativeAI } from '@google/generative-ai';
import { Investment } from '../types/investment';

// Initialize the Gemini API
// Note: In production, this should be done server-side to keep the API key secure
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'demo-key';
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the investment data tools with proper schema
const getInvestmentsTool = {
  name: 'get_investments',
  description: 'Retrieves detailed information about all current investments in the portfolio, including project names, amounts invested, current values, returns, APY percentages, share counts, and investment dates. Call this function when the user asks about their investments, portfolio holdings, or wants to see what they have invested in.',
  parameters: {
    type: 'object' as const,
    properties: {
      // Empty properties for functions that don't need parameters
    },
  },
};

const getPortfolioSummaryTool = {
  name: 'get_portfolio_summary',
  description: 'Retrieves a high-level summary of the entire investment portfolio including total amount invested, current total portfolio value, total profit/loss return, return percentage, and available balance for new investments. Call this when the user asks about overall portfolio performance, total returns, or available funds.',
  parameters: {
    type: 'object' as const,
    properties: {},
  },
};

const getProjectBreakdownTool = {
  name: 'get_project_breakdown',
  description: 'Retrieves a breakdown of investments categorized by project type: GPU Farm vs Datacenter. Shows the count of projects, total value invested, and total current value for each category. Call this when the user asks about the distribution or allocation across different project types.',
  parameters: {
    type: 'object' as const,
    properties: {},
  },
};

// Function implementations
export const investmentFunctions = {
  get_investments: (investments: Investment[]) => {
    return investments.map(inv => ({
      projectName: inv.projectName,
      amountInvested: inv.amount,
      currentValue: inv.currentValue,
      totalReturn: inv.totalReturn,
      returnPercentage: inv.returnPercentage,
      expectedAPY: inv.expectedAPY,
      shares: inv.shares,
      investmentDate: inv.investmentDate,
    }));
  },

  get_portfolio_summary: (data: {
    totalInvested: number;
    totalValue: number;
    totalReturn: number;
    availableBalance: number;
  }) => {
    return {
      totalInvested: data.totalInvested,
      totalValue: data.totalValue,
      totalReturn: data.totalReturn,
      returnPercentage: data.totalInvested > 0 ? (data.totalReturn / data.totalInvested) * 100 : 0,
      availableBalance: data.availableBalance,
    };
  },

  get_project_breakdown: (investments: Investment[], projects: any[]) => {
    const breakdown = investments.reduce((acc: any, inv) => {
      const project = projects.find(p => p.id === inv.projectId);
      const type = project?.projectType || 'Unknown';

      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalValue: 0,
          totalInvested: 0,
        };
      }

      acc[type].count += 1;
      acc[type].totalValue += inv.currentValue;
      acc[type].totalInvested += inv.amount;

      return acc;
    }, {});

    return breakdown;
  },
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export async function chatWithGemini(
  message: string,
  history: ChatMessage[],
  investmentData: {
    investments: Investment[];
    totalInvested: number;
    totalValue: number;
    totalReturn: number;
    availableBalance: number;
  },
  projects: any[]
) {
  console.log('Starting Gemini chat with message:', message);
  console.log('Investment data available:', {
    investmentCount: investmentData.investments.length,
    totalInvested: investmentData.totalInvested,
    totalValue: investmentData.totalValue,
  });

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    tools: [
      {
        functionDeclarations: [
          getInvestmentsTool,
          getPortfolioSummaryTool,
          getProjectBreakdownTool,
        ],
      },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: 'AUTO', // Let the model decide when to use functions
      },
    },
    systemInstruction: 'You are a helpful AI investment advisor. You have access to tools that provide real-time investment data. ALWAYS use the appropriate tool functions to fetch current data before answering questions about investments, portfolio performance, or holdings. Never make up or estimate numbers - always call the tools to get accurate data.',
  });

  const chat = model.startChat({
    history: history,
  });

  const result = await chat.sendMessage(message);
  const response = result.response;

  console.log('Response object:', response);
  console.log('Candidates:', response.candidates);

  // Access function calls from the correct location
  const functionCalls = response.functionCalls?.();
  console.log('Function calls (called):', functionCalls);

  // Also check candidates for function calls
  const candidateParts = response.candidates?.[0]?.content?.parts;
  console.log('Candidate parts:', candidateParts);

  // Find function call in parts
  const functionCallPart = candidateParts?.find((part: any) => part.functionCall);
  console.log('Function call part:', functionCallPart);

  // Check if function calls were made
  if (functionCallPart?.functionCall) {
    console.log('Processing function call:', functionCallPart.functionCall.name);

    const functionCall = functionCallPart.functionCall;
    let functionResponse: any;

    // Get function arguments
    const functionArgs = functionCall.args || {};
    console.log('Function args:', functionArgs);

    // Execute the requested function
    switch (functionCall.name) {
      case 'get_investments':
        functionResponse = investmentFunctions.get_investments(investmentData.investments);
        console.log('get_investments returned:', functionResponse.length, 'investments');
        break;
      case 'get_portfolio_summary':
        functionResponse = investmentFunctions.get_portfolio_summary({
          totalInvested: investmentData.totalInvested,
          totalValue: investmentData.totalValue,
          totalReturn: investmentData.totalReturn,
          availableBalance: investmentData.availableBalance,
        });
        console.log('get_portfolio_summary returned:', functionResponse);
        break;
      case 'get_project_breakdown':
        functionResponse = investmentFunctions.get_project_breakdown(
          investmentData.investments,
          projects
        );
        console.log('get_project_breakdown returned:', functionResponse);
        break;
      default:
        functionResponse = { error: 'Unknown function' };
        console.error('Unknown function requested:', functionCall.name);
    }

    console.log('Sending function response back to model...');

    // Send function response back to model with correct structure
    const result2 = await chat.sendMessage([
      {
        functionResponse: {
          name: functionCall.name,
          response: {
            name: functionCall.name,
            content: functionResponse,
          },
        },
      },
    ]);

    const finalResponse = result2.response.text();
    console.log('Final response generated:', finalResponse);
    return finalResponse;
  }

  console.log('No function calls, returning direct response');
  return response.text();
}
