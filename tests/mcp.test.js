import request from 'supertest';
import { jest } from '@jest/globals';

// Mock yahoo-finance2
const mockYahooFinanceInstance = {
    quote: jest.fn(),
    historical: jest.fn(),
    quoteSummary: jest.fn(),
    search: jest.fn(),
    trendingSymbols: jest.fn(),
    recommendationsBySymbol: jest.fn(),
    screeners: jest.fn(),
    fundamentalsTimeSeries: jest.fn(),
};

jest.unstable_mockModule('yahoo-finance2', () => ({
    default: jest.fn(() => mockYahooFinanceInstance)
}));

// Import app dynamically AFTER mocking
const app = (await import('../src/server.js')).default;
const yahooFinance = mockYahooFinanceInstance;

describe('MCP Server Endpoints', () => {

    describe('GET /mcp/tools', () => {
        it('should list all available tools including new ones', async () => {
            const res = await request(app).get('/mcp/tools');
            expect(res.statusCode).toBe(200);
            expect(res.body.tools).toBeDefined();

            const toolNames = res.body.tools.map(t => t.name);
            expect(toolNames).toContain('get_stock_quote');
            expect(toolNames).toContain('get_etf_holdings');
            expect(toolNames).toContain('get_fund_holdings');
            expect(toolNames).toContain('read_news_article');
        });

        it('should return OpenAI-compatible format when requested', async () => {
            const res = await request(app).get('/mcp/tools?format=openai');
            expect(res.statusCode).toBe(200);
            expect(res.body.tools).toBeDefined();

            const tool = res.body.tools[0];
            expect(tool).toHaveProperty('type', 'function');
            expect(tool).toHaveProperty('function');
            expect(tool.function).toHaveProperty('name');
            expect(tool.function).toHaveProperty('parameters');
            expect(tool.function.parameters).toHaveProperty('type', 'object');
        });
    });

    describe('POST /mcp/call', () => {

        it('should execute get_etf_holdings tool', async () => {
            const mockData = {
                topHoldings: { holdings: [{ symbol: 'AAPL', holdingPercent: 0.05 }] },
                sectorWeightings: [],
                equityHoldings: {}
            };
            yahooFinance.quoteSummary.mockResolvedValue(mockData);

            const res = await request(app)
                .post('/mcp/call')
                .send({
                    name: 'get_etf_holdings',
                    arguments: { symbol: 'SPY' }
                });

            expect(res.statusCode).toBe(200);
            const content = JSON.parse(res.body.content[0].text);
            expect(content).toEqual(mockData);
            expect(yahooFinance.quoteSummary).toHaveBeenCalledWith('SPY', expect.any(Object));
        });

        it('should execute get_fund_holdings tool', async () => {
            const mockData = {
                fundHoldings: { holdings: [] },
                fundProfile: { categoryName: 'Large Blend' }
            };
            yahooFinance.quoteSummary.mockResolvedValue(mockData);

            const res = await request(app)
                .post('/mcp/call')
                .send({
                    name: 'get_fund_holdings',
                    arguments: { symbol: 'VFIAX' }
                });

            expect(res.statusCode).toBe(200);
            const content = JSON.parse(res.body.content[0].text);
            expect(content).toEqual(mockData);
        });

        it('should handle missing tools gracefully', async () => {
            const res = await request(app)
                .post('/mcp/call')
                .send({
                    name: 'non_existent_tool',
                    arguments: {}
                });

            expect(res.statusCode).toBe(404);
        });
    });
});
