// Тестовый скрипт для проверки парсинга API НБРК
const https = require('https');

async function testNBRKAPI() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}.${month}.${year}`;

  const url = `https://nationalbank.kz/rss/get_rates.cfm?fdate=${dateStr}`;
  
  console.log('🔍 Тестирование API НБРК...');
  console.log(`📅 Дата: ${dateStr}`);
  console.log(`🌐 URL: ${url}\n`);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('✅ Ответ получен\n');
        
        // Парсинг XML
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const items = [];
        
        let match;
        while ((match = itemRegex.exec(data)) !== null) {
          const itemXml = match[1];
          
          const extractTag = (tag) => {
            const tagRegex = new RegExp(`<${tag}>([^<]*)<\/${tag}>`, 'i');
            const tagMatch = itemXml.match(tagRegex);
            return tagMatch ? tagMatch[1].trim() : '';
          };

          const title = extractTag('title');
          const description = extractTag('description');
          const quant = extractTag('quant');
          const fullname = extractTag('fullname');

          if (title) {
            items.push({
              code: title,
              fullname: fullname,
              rate: parseFloat(description),
              quant: parseInt(quant) || 1,
              ratePerUnit: parseFloat(description) / (parseInt(quant) || 1)
            });
          }
        }

        // Фильтруем только нужные валюты
        const targetCurrencies = ['USD', 'EUR', 'RUB', 'CNY', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
        const filtered = items.filter(item => targetCurrencies.includes(item.code));

        console.log('📊 Основные валюты:\n');
        console.log('┌─────────┬──────────────────────────────┬─────────────┬───────┬─────────────────┐');
        console.log('│ Код     │ Название                     │ Курс (НБРК) │ Кол-во│ За 1 единицу    │');
        console.log('├─────────┼──────────────────────────────┼─────────────┼───────┼─────────────────┤');
        
        filtered.forEach(item => {
          console.log(`│ ${item.code.padEnd(7)} │ ${item.fullname.substring(0, 28).padEnd(28)} │ ${String(item.rate).padStart(11)} │ ${String(item.quant).padStart(5)} │ ${String(item.ratePerUnit.toFixed(4)).padStart(15)} │`);
        });
        
        console.log('└─────────┴──────────────────────────────┴─────────────┴───────┴─────────────────┘');

        console.log(`\n✅ Всего валют: ${items.length}`);
        console.log(`✅ Отфильтровано: ${filtered.length}`);
        
        // Генерируем код для fallback rates
        console.log('\n📝 Fallback rates для кода:');
        console.log('const fallbackRates: Record<string, number> = {');
        filtered.forEach(item => {
          console.log(`  ${item.code}: ${item.ratePerUnit.toFixed(2)},`);
        });
        console.log('};');

        resolve(filtered);
      });
    }).on('error', (err) => {
      console.error('❌ Ошибка:', err.message);
      reject(err);
    });
  });
}

// Запуск теста
testNBRKAPI()
  .then(() => console.log('\n✅ Тест завершен успешно!'))
  .catch((err) => console.error('\n❌ Тест провален:', err));
