
from datetime import date

# 计算4000礼拜对应的岁数
weeks_per_year = 365.2425 / 7  # 考虑闰年的平均每年周数
years_for_4000_weeks = 4000 / weeks_per_year
print(f"4000礼拜 ≈ {years_for_4000_weeks:.1f} 岁")

# 从1993年3月到2026年4月27日
# 假设出生日期为1993年3月1日（用户只说3月，取月初）
birth_date = date(1993, 3, 1)
today = date(2026, 4, 27)

days_lived = (today - birth_date).days
weeks_lived = days_lived / 7
weeks_remaining = 4000 - weeks_lived

print(f"\n从1993年3月1日到2026年4月27日：")
print(f"已活天数: {days_lived} 天")
print(f"已活礼拜: {weeks_lived:.1f} 个礼拜")
print(f"剩余礼拜: {weeks_remaining:.1f} 个礼拜")
print(f"已用比例: {weeks_lived/4000*100:.1f}%")
print(f"剩余比例: {weeks_remaining/4000*100:.1f}%")

# 也计算一下如果是3月15日或3月底的情况
for day in [15, 31]:
    try:
        birth = date(1993, 3, day)
        days = (today - birth).days
        weeks = days / 7
        remaining = 4000 - weeks
        print(f"\n若生日为3月{day}日：已活 {weeks:.1f} 个礼拜，剩余 {remaining:.1f} 个礼拜")
    except:
        pass
