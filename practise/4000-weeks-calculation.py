from datetime import date
import sys

def main():
    if len(sys.argv) != 2:
        print("用法: python 4000-weeks-calculation.py yyyy-mm-dd")
        print("示例: python 4000-weeks-calculation.py 1993-03-15")
        sys.exit(1)

    date_str = sys.argv[1]
    # parts = ['1993', '03', '15']   # 三个字符串
    parts = date_str.split('-')
    if len(parts) != 3:
        print("错误: 日期格式无效，请使用 yyyy-mm-dd 格式")
        sys.exit(1)
    
    try:
        # year = int(parts[0])
        # month = int(parts[1])
        # day = int(parts[2])
        year, month, day = map(int, parts)
    except ValueError:
        print("错误: 年月日必须为数字")
        sys.exit(1)
    
    try:
        birth_date = date(year, month, day)
    except ValueError:
        print(f"错误: 日期不存在 ({year}年{month}月{day}日)")
        sys.exit(1)

    # 计算4000礼拜对应的岁数
    weeks_per_year = 365.2425 / 7
    years_for_4000_weeks = 4000 / weeks_per_year
    print(f"4000礼拜 ≈ {years_for_4000_weeks:.1f} 岁")

    # 基于传入的出生日期计算
    today = date.today()
    days_lived = (today - birth_date).days
    weeks_lived = days_lived / 7
    weeks_remaining = 4000 - weeks_lived

    print(f"\n从出生日期 {birth_date} 到今天 {today}：")
    print(f"已活天数: {days_lived} 天")
    print(f"已活礼拜: {weeks_lived:.1f} 个礼拜")
    if weeks_remaining >= 0:
        print(f"剩余礼拜: {weeks_remaining:.1f} 个礼拜")
    else:
        print(f"已超过4000周: {abs(weeks_remaining):.1f} 个礼拜")
    print(f"已用比例: {weeks_lived / 4000 * 100:.1f}%")
    if weeks_remaining >= 0:
        print(f"剩余比例: {weeks_remaining / 4000 * 100:.1f}%")



if __name__ == "__main__":
    main()
