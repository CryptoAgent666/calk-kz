#!/usr/bin/env python3
"""
Конвертация SVG шаблонов в PNG иконки
"""
import cairosvg
import os

# Директория public
PUBLIC_DIR = "public"

# Список конвертаций: (исходный SVG, результат PNG, ширина, высота)
conversions = [
    ("apple-touch-icon-template.svg", "apple-touch-icon.png", 180, 180),
    ("icon-192-template.svg", "icon-192.png", 192, 192),
    ("icon-512-template.svg", "icon-512.png", 512, 512),
    ("og-image-template.svg", "og-image.png", 1200, 630),
]

def main():
    for src, dst, width, height in conversions:
        src_path = os.path.join(PUBLIC_DIR, src)
        dst_path = os.path.join(PUBLIC_DIR, dst)
        
        if not os.path.exists(src_path):
            print(f"⚠️  Файл не найден: {src_path}")
            continue
        
        print(f"Конвертация {src} -> {dst} ({width}x{height})...")
        
        cairosvg.svg2png(
            url=src_path,
            write_to=dst_path,
            output_width=width,
            output_height=height
        )
        
        # Проверяем размер файла
        size = os.path.getsize(dst_path)
        print(f"  ✓ Создан {dst} ({size:,} байт)")

    print("\n✅ Конвертация завершена!")

if __name__ == "__main__":
    main()




