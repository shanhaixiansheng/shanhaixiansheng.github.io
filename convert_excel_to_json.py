import pandas as pd
import json
from datetime import datetime

# 读取Excel文件
excel_file = r'H:\comate\fanucxitong\FANUC系统变量表 1.xlsx'
output_file = r'H:\comate\Robot助手\data\fanuc-variable.json'

try:
    # 读取Excel文件的第一个工作表
    df = pd.read_excel(excel_file, sheet_name=0)
    
    # 打印列名以了解Excel结构
    print("Excel列名:")
    print(df.columns.tolist())
    print("\n前5行数据:")
    print(df.head())
    
    # 假设Excel有特定的列结构，根据实际列名调整
    # 如果列名是中文，需要相应调整
    data_list = []
    
    # 根据实际列名处理数据
    # 根据实际Excel结构：变量名称、变量注释、备注
    for index, row in df.iterrows():
        try:
            # 根据实际Excel结构调整
            variable_name = str(row['变量名称']) if pd.notna(row['变量名称']) else ""
            variable_comment = str(row['变量注释']) if pd.notna(row['变量注释']) else ""
            remark = str(row['备注']) if pd.notna(row['备注']) else ""
            
            # 将备注添加到描述中
            description = variable_comment
            if remark and remark != 'nan':
                description += " | " + remark
            
            item = {
                "number": variable_name,
                "name": variable_comment,
                "description": description,
                "dataType": "数值",  # 默认值
                "range": "系统定义",
                "unit": "",
                "category": "系统变量"
            }
            data_list.append(item)
        except Exception as e:
            print(f"处理第{index+1}行时出错: {e}")
            continue
    
    # 创建JSON结构
    json_data = {
        "brand": "FANUC",
        "type": "variable",
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