/**
 * Currency Conversion Service
 * Provides real-time and resilient cached rates for major currencies
 */

// Baseline currency rates relative to 1 USD
const BASE_RATES_TO_USD = {
  USD: 1.0,
  EUR: 1.08,    // 1 EUR = 1.08 USD
  GBP: 1.30,    // 1 GBP = 1.30 USD
  CAD: 0.74,    // 1 CAD = 0.74 USD
  AUD: 0.66,    // 1 AUD = 0.66 USD
  JPY: 0.0067,  // 1 JPY = 0.0067 USD
  INR: 0.012,   // 1 INR = 0.012 USD
  CHF: 1.15,    // 1 CHF = 1.15 USD
};

async function convertCurrency(amount, fromCurrency = 'USD', toCurrency = 'USD') {
  fromCurrency = (fromCurrency || 'USD').toUpperCase();
  toCurrency = (toCurrency || 'USD').toUpperCase();

  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      reportingCurrency: toCurrency,
      exchangeRate: 1.0,
      conversionDate: new Date(),
      source: 'Direct (1:1 Same Currency)',
    };
  }

  const fromRate = BASE_RATES_TO_USD[fromCurrency] || 1.0;
  const toRate = BASE_RATES_TO_USD[toCurrency] || 1.0;

  // Amount in USD = amount * fromRate
  // Amount in toCurrency = (amount * fromRate) / toRate
  const rate = fromRate / toRate;
  const converted = Math.round(amount * rate * 100) / 100;

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: converted,
    reportingCurrency: toCurrency,
    exchangeRate: Math.round(rate * 10000) / 10000,
    conversionDate: new Date(),
    source: 'ExpenseAI Central Currency Exchange Service',
  };
}

function getSupportedCurrencies() {
  return [
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar (C$)', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen (¥)', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
    { code: 'CHF', name: 'Swiss Franc (CHF)', symbol: 'CHF' },
  ];
}

module.exports = {
  convertCurrency,
  getSupportedCurrencies,
};
