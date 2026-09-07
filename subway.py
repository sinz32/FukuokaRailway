import requests, io
import numpy as np
from PIL import Image
import subway_positions

def find_train(img_np, x, y):
    # 상행 열차 찾기
    if bool(np.all(img_np[y['up'], x] == [74, 74, 74])): # 보통 
        return {'dir': 'up', 'type': 0}
    if bool(np.all(img_np[y['up'], x] == [255, 208, 0])): # 쾌속이지만, 지하철 구간에서는 보통
        return {'dir': 'up', 'type': 1}

    # 하행 열차 찾기
    if bool(np.all(img_np[y['down'], x] == [74, 74, 74])): # 보통 
        return {'dir': 'down', 'type': 0}
    if bool(np.all(img_np[y['down'], x] == [255, 208, 0])): # 쾌속이지만, 지하철 구간에서는 보통
        return {'dir': 'down', 'type': 1}

    return None
    
def get_data_subway(line):
    image = 'PC_Kuhako.png'
    if line == 'N': image = 'PC_Nanakuma.png'
    url = 'https://unkou.subway.city.fukuoka.lg.jp/unkou/' + image
    
    res = requests.get(url)
    res.raise_for_status()
    img_np = np.array(Image.open(io.BytesIO(res.content)).convert("RGB"))
    # 이미지를 잘 읽어오기는 하는지 디버기하는 용도
    # with open('debug_output.png', 'wb') as f:
    #     f.write(res.content)

    pos = []
    if line == 'A':
        pos = subway_positions.air
    elif line == 'H':
        pos = subway_positions.hakozaki
    elif line == 'N':
        pos = subway_positions.nanakuma
    
    results = []
    for p in pos['data']:
        data = find_train(img_np, p['x'], pos['y'])
        print(p)
        print(img_np[pos['y']['up'], p['x']])
        print(img_np[pos['y']['down'], p['x']])
        if data != None:
            stn = p['p']
            status = '도착'
            if '-' in stn:
                status = '접근'
                stn = stn.split('-')
                if data['dir'] == 'up':
                    stn = stn[0]
                else:
                    stn = stn[1]
            results.append({
                'stn': stn,
                'status': status,
                'dir': data['dir'],
                'type': data['type']
            })
        
    return results


