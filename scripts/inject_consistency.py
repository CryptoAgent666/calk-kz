#!/usr/bin/env python3
"""
Bulk-inject CalculatorExamples component + new QuickAnswer/MethodologySection
into all calculator files where data exists in the respective registries.

Idempotent: skips files that already have the components.
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
CALC_DIR = ROOT / 'src' / 'components' / 'calculators'
DATA_DIR = ROOT / 'src' / 'data'

# Read which IDs exist in each registry
def get_ids(file_path, pattern=r"^\s+'([a-z][a-z0-9-]+)'\s*:\s*\{"):
    ids = set()
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            m = re.match(pattern, line)
            if m:
                ids.add(m.group(1))
    return ids

EXAMPLES_IDS = get_ids(DATA_DIR / 'calculatorExamples.ts')
METHODOLOGY_IDS = get_ids(DATA_DIR / 'calculatorMethodology.ts')
QA_IDS = get_ids(ROOT / 'src' / 'components' / 'ui' / 'QuickAnswer.tsx')

print(f"Examples registry: {len(EXAMPLES_IDS)} IDs")
print(f"Methodology registry: {len(METHODOLOGY_IDS)} IDs")
print(f"QuickAnswer registry: {len(QA_IDS)} IDs")

# File name → calculator ID overrides (when file name doesn't match the ID convention)
FILE_OVERRIDES = {
    'NotaryServicesCalculator.tsx': 'notary',
    'CorporateIncomeTaxCalculator.tsx': 'corporate-income-tax',
    'IPSimplifiedCalculator.tsx': 'ip-simplified',
    'MortgageCalculator.tsx': 'mortgage-specialized',
    'RentOrBuyCalculator.tsx': 'rent-vs-buy',
    'CryptoTaxCalculator.tsx': 'crypto-tax',
    'VATCalculator.tsx': 'vat',
    'BMICalculator.tsx': 'bmi',
    'FIRECalculator.tsx': 'fire',
    'GPACalculator.tsx': 'gpa',
    'GONSCalculator.tsx': 'gons',
    'KurbanCalculator.tsx': 'kurban-sacrifice',  # existing pattern
    'IslamicInheritanceCalculator.tsx': 'islamic-inheritance',
    'IslamicMortgageCalculator.tsx': 'islamic-mortgage',
    'RamadanSadaqahCalculator.tsx': 'ramadan-sadaqah',
    'HajjCalculator.tsx': 'hajj',
    'BodyFatCalculator.tsx': 'body-fat',
    'WaterIntakeCalculator.tsx': 'water-intake',
    'CaloriesCalculator.tsx': 'calories',
    'WallpaperCalculator.tsx': 'wallpaper',
    'FlooringCalculator.tsx': 'flooring',
    'WaterBillCalculator.tsx': 'water-bill',
    'ElectricityBillCalculator.tsx': 'electricity',
    'CashbackCalculator.tsx': 'cashback',
    'EarlyRepaymentCalculator.tsx': 'early-repayment',
    'AgeCalculator.tsx': 'age',
    'PregnancyCalculator.tsx': 'pregnancy',
    'AutoLeasingCalculator.tsx': 'auto-leasing',
    'CompoundInterestCalculator.tsx': 'compound-interest',
    'ConcreteVolumeCalculator.tsx': 'concrete-volume',
    'CourtFeeCalculator.tsx': 'court-fee',
    'CurrencyConverterCalculator.tsx': 'currency-converter',
    'CustomsClearanceCalculator.tsx': 'customs-clearance',
    'FuelCostCalculator.tsx': 'fuel-cost',
    'IncomeTaxCalculator.tsx': 'income-tax',
    'MaternityBenefitsCalculator.tsx': 'maternity-benefits',
    'MicroloanCalculator.tsx': 'microloan',
    'PensionAnnuityCalculator.tsx': 'pension-annuity',
    'PropertyTaxCalculator.tsx': 'property-tax',
    'RecyclingFeeCalculator.tsx': 'recycling-fee',
    'SickLeaveCalculator.tsx': 'sick-leave',
    'UnifiedPaymentCalculator.tsx': 'unified-payment',
    'VacationPayCalculator.tsx': 'vacation-pay',
    'VehicleTaxCalculator.tsx': 'vehicle-tax',
    'BreakEvenCalculator.tsx': 'break-even',
    'BusinessROICalculator.tsx': 'business-roi',
    'CreditCalculator.tsx': 'credit',
    'DepositCalculator.tsx': 'deposit',
    'DiscountCalculator.tsx': 'discount',
    'DivorceCalculator.tsx': 'divorce',
    'AlimonyCalculator.tsx': 'alimony',
    'InheritanceCalculator.tsx': 'inheritance',
    'KaskoCalculator.tsx': 'kasko',
    'PenaltyCalculator.tsx': 'penalty',
    'PensionCalculator.tsx': 'pension',
    'PercentageCalculator.tsx': 'percentage',
    'RefinancingCalculator.tsx': 'refinancing',
    'SalaryCalculator.tsx': 'salary',
    'ZakatCalculator.tsx': 'zakat',
}

# Find calc file by ID
def find_file_by_id(calc_id):
    """Returns path to calc file matching a calculator ID, or None."""
    # First check overrides
    for fname, mapped_id in FILE_OVERRIDES.items():
        if mapped_id == calc_id:
            p = CALC_DIR / fname
            if p.exists():
                return p
    # Then try to guess from id
    # 'income-tax' → 'IncomeTaxCalculator.tsx'
    parts = calc_id.split('-')
    candidate_name = ''.join(p.capitalize() for p in parts) + 'Calculator.tsx'
    p = CALC_DIR / candidate_name
    if p.exists():
        return p
    return None

def detect_existing_qa_id(content):
    """Detects existing calculatorId from <QuickAnswer calculatorId="X" />."""
    m = re.search(r'<QuickAnswer\s+calculatorId="([^"]+)"', content)
    return m.group(1) if m else None

def has_examples_component(content):
    return '<CalculatorExamples' in content

def has_methodology_component(content):
    return '<MethodologySection' in content

def has_quickanswer_component(content):
    return '<QuickAnswer' in content

def has_examples_import(content):
    return 'CalculatorExamples' in content and "from '../ui/CalculatorExamples'" in content

def has_methodology_import(content):
    return 'getMethodology' in content or 'MethodologySection' in content

def has_quickanswer_import(content):
    return "import { QuickAnswer }" in content

def inject_examples(content, calc_id):
    """Inject <CalculatorExamples calculatorId="..." /> + import. Returns new content or None if no insertion point found."""
    if has_examples_component(content):
        return None

    # 1. Add import
    if not has_examples_import(content):
        # Find a good place: after QuickAnswer import or after FAQSection import
        if "from '../ui/QuickAnswer'" in content:
            content = content.replace(
                "from '../ui/QuickAnswer';",
                "from '../ui/QuickAnswer';\nimport { CalculatorExamples } from '../ui/CalculatorExamples';",
                1
            )
        elif "from '../ui/FAQSection'" in content:
            # add import after that import line
            content = re.sub(
                r"(import\s+\{[^}]*\}\s+from\s+'\.\./ui/FAQSection';)",
                r"\1\nimport { CalculatorExamples } from '../ui/CalculatorExamples';",
                content, count=1
            )
        else:
            # Add after the first import block
            first_import_end = content.find('\n\n', content.find('import '))
            if first_import_end < 0:
                return None
            content = (
                content[:first_import_end]
                + "\nimport { CalculatorExamples } from '../ui/CalculatorExamples';"
                + content[first_import_end:]
            )

    # 2. Insert <CalculatorExamples /> before <MethodologySection /> if it exists
    examples_jsx = f'      <CalculatorExamples calculatorId="{calc_id}" />\n'

    if has_methodology_component(content):
        # Insert before <MethodologySection ...
        new_content, n = re.subn(
            r'(\s+)(<MethodologySection)',
            lambda m: m.group(1) + f'<CalculatorExamples calculatorId="{calc_id}" />' + m.group(1) + m.group(2),
            content, count=1
        )
        if n > 0:
            return new_content

    # Otherwise insert before <FAQSection ...
    new_content, n = re.subn(
        r'(\s+)(<FAQSection)',
        lambda m: m.group(1) + f'<CalculatorExamples calculatorId="{calc_id}" />' + m.group(1) + m.group(2),
        content, count=1
    )
    if n > 0:
        return new_content

    # Last resort: insert before LastUpdated
    new_content, n = re.subn(
        r'(\s+)(<LastUpdated)',
        lambda m: m.group(1) + f'<CalculatorExamples calculatorId="{calc_id}" />' + m.group(1) + m.group(2),
        content, count=1
    )
    if n > 0:
        return new_content

    return None

def inject_methodology(content, calc_id):
    """Inject <MethodologySection ... /> + imports."""
    if has_methodology_component(content):
        return None

    # 1. Add imports
    if "MethodologySection" not in content:
        # Need to update import from FAQSection
        m = re.search(r"import\s+\{([^}]+)\}\s+from\s+'\.\./ui/FAQSection';", content)
        if m:
            imports = m.group(1)
            if 'MethodologySection' not in imports:
                new_imports = imports.strip().rstrip(',') + ', MethodologySection'
                content = content.replace(m.group(0), f"import {{ {new_imports} }} from '../ui/FAQSection';", 1)
        else:
            # No FAQSection import — add full import after first import block
            first_import_end = content.find('\n\n', content.find('import '))
            content = (
                content[:first_import_end]
                + "\nimport { MethodologySection } from '../ui/FAQSection';"
                + content[first_import_end:]
            )

    if 'getMethodology' not in content:
        # Add import for getMethodology after calculatorMethodology-related imports
        # Find a similar data import to put it nearby
        if "from '../../data/calculatorSources'" in content:
            content = re.sub(
                r"(import\s+\{[^}]*\}\s+from\s+'\.\./\.\./data/calculatorSources';)",
                r"\1\nimport { getMethodology } from '../../data/calculatorMethodology';",
                content, count=1
            )
        else:
            # add after the MethodologySection-related import
            content = re.sub(
                r"(import\s+\{[^}]*MethodologySection[^}]*\}\s+from\s+'\.\./ui/FAQSection';)",
                r"\1\nimport { getMethodology } from '../../data/calculatorMethodology';",
                content, count=1
            )

    # 2. Insert <MethodologySection ... /> before <FAQSection ... />
    new_content, n = re.subn(
        r'(\s+)(<FAQSection)',
        lambda m: m.group(1) + f'<MethodologySection steps={{getMethodology(\'{calc_id}\')}} />' + m.group(1) + m.group(2),
        content, count=1
    )
    if n > 0:
        return new_content

    # Otherwise insert before <CalculatorExamples /> (already injected above, won't likely happen)
    new_content, n = re.subn(
        r'(\s+)(<CalculatorExamples)',
        lambda m: m.group(1) + f'<MethodologySection steps={{getMethodology(\'{calc_id}\')}} />' + m.group(1) + m.group(2),
        content, count=1
    )
    if n > 0:
        return new_content

    return None

def inject_quickanswer(content, calc_id):
    """Inject <QuickAnswer ... /> + import."""
    if has_quickanswer_component(content):
        return None

    # 1. Add import
    if not has_quickanswer_import(content):
        # Add after first import block
        first_import_end = content.find('\n\n', content.find('import '))
        content = (
            content[:first_import_end]
            + "\nimport { QuickAnswer } from '../ui/QuickAnswer';"
            + content[first_import_end:]
        )

    # 2. Insert at the top of the JSX return (right after `return (`)
    # Find the main return ( and insert
    # Try common patterns: <div ...> after the outer wrapper
    m = re.search(r'(\n\s+return\s*\(\s*\n\s+<div[^>]*>\n)', content)
    if m:
        insertion = f'      <QuickAnswer calculatorId="{calc_id}" />\n'
        content = content[:m.end()] + insertion + content[m.end():]
        return content

    return None

# ============================================================
# Main
# ============================================================
total_examples = 0
total_methodology = 0
total_qa = 0

for calc_id in sorted(EXAMPLES_IDS):
    fpath = find_file_by_id(calc_id)
    if not fpath:
        print(f"⚠️  [Examples] No file found for ID: {calc_id}")
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = inject_examples(content, calc_id)
    if new_content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ [Examples] Injected into {fpath.name} (id={calc_id})")
        total_examples += 1
    else:
        print(f"⏭️  [Examples] Skipped {fpath.name} (already has or no insert point)")

for calc_id in sorted(METHODOLOGY_IDS):
    fpath = find_file_by_id(calc_id)
    if not fpath:
        print(f"⚠️  [Methodology] No file found for ID: {calc_id}")
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = inject_methodology(content, calc_id)
    if new_content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ [Methodology] Injected into {fpath.name} (id={calc_id})")
        total_methodology += 1
    else:
        # Skipping is normal when already present
        pass

for calc_id in sorted(QA_IDS):
    fpath = find_file_by_id(calc_id)
    if not fpath:
        print(f"⚠️  [QA] No file found for ID: {calc_id}")
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = inject_quickanswer(content, calc_id)
    if new_content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ [QA] Injected into {fpath.name} (id={calc_id})")
        total_qa += 1

print(f"\n=== SUMMARY ===")
print(f"Examples injected:    {total_examples}")
print(f"Methodology injected: {total_methodology}")
print(f"QuickAnswer injected: {total_qa}")
