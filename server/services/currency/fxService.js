/**
 * Multi-Currency Exchange Rate Conversion Service
 */
class CurrencyService {
  constructor() {
    // Exchange rates relative to base currency (USD)
    this.rates = {
      USD: 1.0,
      EUR: 1.08,  // 1 EUR = 1.08 USD
      GBP: 1.27,  // 1 GBP = 1.27 USD
      INR: 0.012, // 1 INR = 0.012 USD
      CAD: 0.74,  // 1 CAD = 0.74 USD
      JPY: 0.0065,// 1 JPY = 0.0065 USD
    };
  }

  /**
   * Convert currency to base currency (USD)
   */
  convertAmount(amount, originalCurrency = 'USD', targetCurrency = 'USD') {
    const origCurr = originalCurrency.toUpperCase();
    const targCurr = targetCurrency.toUpperCase();

    const rateOrig = this.rates[origCurr] || 1.0;
    const rateTarg = this.rates[targCurr] || 1.0;

    // Calculate conversion rate to USD
    const exchangeRate = rateOrig / rateTarg;
    const convertedAmount = amount * exchangeRate;

    return {
      originalAmount: parseFloat(amount),
      originalCurrency: origCurr,
      targetCurrency: targCurr,
      exchangeRate: parseFloat(exchangeRate.toFixed(4)),
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      conversionDate: new Date().toISOString().split('T')[0]
    };
  }
}

module.exports = new CurrencyService();
