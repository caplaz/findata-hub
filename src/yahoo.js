import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey", "schemaValidation"],
  validation: {
    logErrors: false,
    logOptionsErrors: false,
    throwErrors: false,
  },
});
export default yahooFinance;
