const fs = require('fs');
const path = require('path');

const calculatorsDir = path.join(__dirname, '../src/components/calculators');
const ruJsonPath = path.join(__dirname, '../src/i18n/locales/ru/calculators.json');
const kkJsonPath = path.join(__dirname, '../src/i18n/locales/kk/calculators.json');

// Читаем JSON файлы
let ruJson = JSON.parse(fs.readFileSync(ruJsonPath, 'utf8'));
let kkJson = JSON.parse(fs.readFileSync(kkJsonPath, 'utf8'));

// Получаем список файлов калькуляторов
const files = fs.readdirSync(calculatorsDir).filter(f => f.endsWith('.tsx'));

let updated = 0;

files.forEach(file => {
  const filePath = path.join(calculatorsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ищем FAQSection с захардкоженными строками
  const faqMatch = content.match(/<FAQSection\s+items=\{\[([\s\S]*?)\]\}\s+sources/);
  
  if (faqMatch && faqMatch[1].includes("question: '")) {
    // Извлекаем ID калькулятора из имени файла
    const calcName = file.replace('Calculator.tsx', '').replace('.tsx', '');
    
    // Преобразуем имя файла в kebab-case ключ
    const calcKey = calcName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/^(.)/, m => m.toLowerCase());
    
    // Парсим FAQ items
    const itemsStr = faqMatch[1];
    const questionMatches = itemsStr.match(/question:\s*['"`]([^'"`]+)['"`]/g) || [];
    const answerMatches = itemsStr.match(/answer:\s*['"`]([^'"`]+)['"`]/g) || [];
    
    if (questionMatches.length > 0) {
      console.log(`Processing ${file} -> ${calcKey}`);
      
      // Создаём новый FAQSection
      let newItems = [];
      for (let i = 0; i < questionMatches.length; i++) {
        newItems.push(`          { question: t('${calcKey}.faq.q${i+1}'), answer: t('${calcKey}.faq.a${i+1}') }`);
      }
      
      // Заменяем в файле
      const oldFaqSection = faqMatch[0];
      const newFaqSection = `<FAQSection
        items={[
${newItems.join(',\n')}
        ]}
        sources`;
      
      content = content.replace(oldFaqSection, newFaqSection);
      fs.writeFileSync(filePath, content);
      
      updated++;
      console.log(`  Updated ${file}`);
    }
  }
});

console.log(`\nTotal updated: ${updated} files`);



