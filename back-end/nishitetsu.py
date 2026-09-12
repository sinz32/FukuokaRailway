import requests, io

def get_data_nishitetsu(line):
    url = 'https://busnavi-railway.nnr.co.jp/tenjin_omuta/tenjin-omuta.json'
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
        )
    }

    res = requests.get(url, headers=headers)
    res.encoding = 'utf-8-sig'
    res.raise_for_status()
    json_data = res.json()


    dirs = [None, 'up', 'down']
    train_list = []

    for e in json_data['locationObjects']:
        row = int(e['locationRow']) - 1
        index = row // 3
        mod = row % 3
        sts = '도착'

        if e['trainDirection'] == 1:  # 상행
            if mod == 1:
                sts = '접근'
            elif mod == 2:
                sts = '출발'
                index += 1
        else:  # 하행
            if mod == 1:
                sts = '출발'
            elif mod == 2:
                sts = '접근'
                index += 1

        col = str(e['locationCol'])
        if col in ('5', '6'):
            if index not in (12, 24):
                if index > 12:
                    index += 39
                else:
                    index += 40

        train_list.append({
                'dir': dirs[int(e['trainDirection'])],
                'index': index,
                'sts': sts,
                'type': e['trainInfoObjects'][0]['trainType'],
                'col': col,
            })

    station_list = [
        '니시테츠후쿠오카(텐진) (西鉄福岡(天神))', '야쿠인 (薬院)', '니시테츠히라오 (西鉄平尾)', '타카미야 (高宮)', '오하시 (大橋)', '이지리 (井尻)', '잣쇼노쿠마 (雑餉隈)', '(사쿠라나미키)', '카스가바루 (春日原)', '시라키바루 (白木原)', '시모오리 (下大利)', '토후로마에 (都府楼前)', '니시테츠후츠카이치 (西鉄二日市)', '무라사키 (紫)', '아사쿠라가이도 (朝倉街道)', '사쿠라다이 (桜台)', '치쿠시 (筑紫)', '츠코 (津古)', '미쿠니가오카 (三国が丘)', '미츠사와 (三沢)', '오호 (大保)', '니시테츠오고리 (西鉄小郡)', '하타마 (端間)', '아지사카 (味坂)', '미야노진 (宮の陣)', '쿠시와라 (櫛原)', '니시테츠쿠루메 (西鉄久留米)', '하나바타케 (花畑)', '시켄조마에 (試験場前)', '츠부쿠 (津福)', '야스타케 (安武)', '다이젠지 (大善寺)', '미즈마 (三潴)', '이누즈카 (犬塚)', '오미조 (大溝)', '핫쵸무타 (八丁牟田)', '카마치 (蒲池)', '야카베 (矢加部)', '니시테츠야나가와 (西鉄柳川)', '토쿠마스 (徳益)', '시오츠카 (塩塚)', '니시테츠나카시마 (西鉄中島)', '에노우라 (江の浦)', '히라키 (開)', '니시테츠와타제 (西鉄渡瀬)', '쿠라나가 (倉永)', '히가시아마기 (東甘木)', '니시테츠긴스이 (西鉄銀水)', '신사카에마치 (新栄町)', '오무타 (大牟田)',
        '다자이후 (太宰府)', '니시테츠고조 (西鉄五条)',
        '아마기 (甘木)', '마다 (馬田)', '카미우라 (上浦)', '혼고 (本郷)', '오제키 (大堰)', '카네시마 (金島)', '오키 (大城)', '키타노 (北野)', '코간차야 (古賀茶屋)', '갓코마에 (学校前)', '고로마루 (五郎丸)'
    ]
    types = {'普通': '보통', '急行': '급행', '特急': '특급'}

    result = []
    for i, v in enumerate(station_list):
        result.append({
            'stn': v,
            'up': [],
            'down': []
        })

    for item in train_list:
        idx = item['index']
        dir = item['dir']

        if 0 <= idx < len(result) and dir:
            train_type = item['type']

            result[idx][dir].append({
                    'sts': item['sts'],
                    'type': types.get(train_type, train_type),
                })

    if line == 'T':
        return result[:50]
    
    if line == 'D':
        fukukaichi = result[12]
        result = result[50:52]
        result.append(fukukaichi)
        return result
