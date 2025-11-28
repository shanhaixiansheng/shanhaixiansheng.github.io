import json

# 读取转换后的JSON文件
with open('data/fanuc-alarm.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total records: {len(data['data'])}")
print("\nFirst record:")
print(data['data'][0])
print("\nLast record:")
print(data['data'][-1])