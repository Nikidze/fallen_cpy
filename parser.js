const ccxt = require('ccxt');
const config = require('./config.json');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(config.botToken);
const chatId = config.chatId;

(async function() {

    let botMsg = "Токены упавшие более, чем на 50% за 24 часа:";

    for(const exchangeId of ['okx', 'bybit', 'bingx', 'bitget']) {
        const exchange = new ccxt['bybit']({ 'enableRateLimit': true });

        try {
            const markets = await exchange.loadMarkets();

            const symbols = Object.values(markets).map(function(market) {
                return {
                    symbol: market.symbol,
                    quote: market.quote,
                    swap: market.swap,
                }
            }).filter(market => market.swap && market.quote == 'USDT').map(market => market.symbol);
            const tickers = await exchange.fetchTickers(symbols);

            const fallenTokens = Object.keys(tickers).filter(symbol => {
                const ticker = tickers[symbol];
                // Рассчитываем процентное изменение за последние 24 часа
                const change = ticker['percentage'];
                return change <= -50;
            });

            if (fallenTokens.length !== 0) {
                botMsg += "\n\n"+exchangeId+"\n\n";
                botMsg = fallenTokens.reduce((value, symbol) => {
                    return value + symbol + ": " + tickers[symbol]['percentage'].toFixed(2) + '%' + "\n";
                }, botMsg);
            }
        } catch (error) {
            console.error(`Ошибка при запросе данных: ${error.message}`);
        } 
    };


    console.log(botMsg);
    bot.sendMessage(chatId, botMsg);

})();