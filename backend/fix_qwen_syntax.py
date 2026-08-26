import os

filepath = os.path.join(os.path.dirname(__file__), "qwen_logic.py")
with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "Family Income:" in line or "max_income/100000" in line or "family_income:,.0f" in line:
        # Fix any corrupted currency symbols or missing curly braces
        line = line.replace("頒family_income:,.0f}", "Rs. {family_income:,.0f}")
        line = line.replace("頒family_income:,.0f}", "Rs. {family_income:,.0f}")
        line = line.replace("頒(max_income/100000):.1f}", "Rs. {(max_income/100000):.1f}")
        line = line.replace("頒(max_income/100000):.1f}", "Rs. {(max_income/100000):.1f}")
        line = line.replace("頒(s['max_income']/100000):.1f}", "Rs. {(s['max_income']/100000):.1f}")
        line = line.replace("頒(s['max_income']/100000):.1f}", "Rs. {(s['max_income']/100000):.1f}")
    new_lines.append(line)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Successfully cleaned f-string syntax in qwen_logic.py!")
