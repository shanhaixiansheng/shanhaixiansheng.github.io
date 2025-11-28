import pandas as pd
import json
from datetime import datetime

# 读取Excel文件
excel_file = r'H:\comate\fanucbaojing\FANUC报警代码表.xlsx'
output_file = r'H:\comate\Robot助手\data\fanuc-alarm.json'

try:
    # 读取Excel文件的第一个工作表
    df = pd.read_excel(excel_file, sheet_name=0)
    
    # 打印列名以了解Excel结构
    print("Excel列名:")
    print(df.columns.tolist())
    print("\n前5行数据:")
    print(df.head())
    
    # 根据实际列结构处理数据
    data_list = []
    
    # 根据实际Excel列结构进行处理
    for index, row in df.iterrows():
        try:
            # 根据实际Excel结构调整
            code = str(row['报警代码名称']) if pd.notna(row['报警代码名称']) else ""
            name = str(row['报警代码注释']) if pd.notna(row['报警代码注释']) else ""
            solution = str(row['解决方案']) if pd.notna(row['解决方案']) else ""
            
            # 跳过标题行或无效行
            if not code or code == "nan" or "报警" in code and ("表" in code or "类型" in code):
                continue
            
            # 根据代码确定类别
            category = "其他报警"
            level = "中等"
            
            if "SRVO" in str(code):
                category = "伺服报警"
                level = "严重" if any(err in str(code) for err in ["-001", "-002", "-003", "-005", "-007", "-018", "-021", "-022", "-050", "-202", "-204", "-213", "-230", "-231", "-233", "-278"]) else "中等"
            elif "SYST" in str(code):
                category = "系统报警"
            elif "INTP" in str(code):
                category = "接口报警"
            elif "PROG" in str(code):
                category = "程序报警"
                level = "中等"
            elif "TPIF" in str(code):
                category = "接口报警"
            elif "PRIO" in str(code):
                category = "I/O报警"
                level = "中等"
            elif "SPC" in str(code):
                category = "其他报警"
                level = "中等" if "044" in str(code) else "严重" if "101" in str(code) else "中等"
            
            item = {
                "code": code,
                "name": name,
                "description": name,  # 使用name作为description
                "category": category,
                "level": level,
                "solution": solution if solution and solution != "nan" else "请参考FANUC技术手册获取详细解决方案"
            }
            data_list.append(item)
        except Exception as e:
            print(f"处理第{index+1}行时出错: {e}")
            continue
    
    # 创建JSON结构
    json_data = {
        "brand": "FANUC",
        "type": "alarm",
        "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
        "data": data_list
    }
    
    # 写入JSON文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n成功转换并覆盖文件: {output_file}")
    print(f"总共转换了 {len(data_list)} 条记录")

except Exception as e:
    print(f"处理Excel文件时出错: {e}")