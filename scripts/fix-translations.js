import fs from 'fs';
import path from 'path';

const ruPath = path.join(process.cwd(), 'src/i18n/locales/ru/calculators.json');
const kkPath = path.join(process.cwd(), 'src/i18n/locales/kk/calculators.json');

const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));
const kkJson = JSON.parse(fs.readFileSync(kkPath, 'utf-8'));

// 1. Remove old/duplicate keys
const keysToRemove = ['ramadan-sadaqah-old', 'islamic-inheritance-old', 'propertyTax', 'vehicleTax', 'customsClearance', 'leapYear', 'luxuryTax', 'timeConverter', 'numberToWords', 'islamicInheritance', 'ramadanSadaqah'];
for (const key of keysToRemove) {
  if (ruJson[key]) {
    delete ruJson[key];
    console.log('Removed from RU:', key);
  }
  if (kkJson[key]) {
    delete kkJson[key];
    console.log('Removed from KK:', key);
  }
}

// 2. Copy rent-or-buy to KK if missing
if (ruJson['rent-or-buy'] && !kkJson['rent-or-buy']) {
  kkJson['rent-or-buy'] = {
    title: "Сатып алу немесе жалға алу калькуляторы",
    description: "Тұрғын үй сатып алу немесе жалға алудың тиімділігін салыстыру",
    ...JSON.parse(JSON.stringify(ruJson['rent-or-buy']))
  };
  console.log('Copied rent-or-buy to KK');
}

// 3. Sync vehicle-tax to KK
if (ruJson['vehicle-tax'] && Object.keys(kkJson['vehicle-tax'] || {}).length < 10) {
  kkJson['vehicle-tax'] = {
    title: "Көлік салығы калькуляторы",
    description: "Көлік құралына салықты есептеу",
    subtitle: "Көлік құралына салықты есептеу",
    ...JSON.parse(JSON.stringify(ruJson['vehicle-tax']))
  };
  console.log('Synced vehicle-tax to KK');
}

// 4. Sync pension to KK
if (ruJson['pension'] && Object.keys(kkJson['pension'] || {}).length < 10) {
  kkJson['pension'] = {
    title: "Зейнетақы калькуляторы",
    description: "Зейнетақыны есептеу",
    ...JSON.parse(JSON.stringify(ruJson['pension']))
  };
  console.log('Synced pension to KK');
}

// 5. Sync number-to-words to KK
if (ruJson['number-to-words'] && Object.keys(kkJson['number-to-words'] || {}).length < 10) {
  kkJson['number-to-words'] = {
    title: "Санды жазбаша калькуляторы",
    description: "Санды жазбаша түрге айналдыру",
    ...JSON.parse(JSON.stringify(ruJson['number-to-words']))
  };
  console.log('Synced number-to-words to KK');
}

// 6. Fix incomplete entries
const incompleteKeys = ['mortgage-specialized', 'unemployment', 'time-to-words', 'leap-year'];
for (const key of incompleteKeys) {
  if (ruJson[key] && Object.keys(ruJson[key]).length <= 3) {
    // Add basic FAQ if missing
    if (!ruJson[key].faq) {
      ruJson[key].faq = {
        q1: "Как пользоваться калькулятором?",
        a1: "Введите данные и нажмите рассчитать.",
        q2: "Точность расчета?",
        a2: "Расчет носит ознакомительный характер."
      };
    }
    if (!ruJson[key].subtitle) {
      ruJson[key].subtitle = ruJson[key].description || ruJson[key].title;
    }
  }
}

fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 2), 'utf-8');
fs.writeFileSync(kkPath, JSON.stringify(kkJson, null, 2), 'utf-8');

console.log('\n✅ Translation fixes applied!');
console.log('RU keys:', Object.keys(ruJson).length);
console.log('KK keys:', Object.keys(kkJson).length);


