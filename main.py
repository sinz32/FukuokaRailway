from fastapi import FastAPI
from typing import Optional
from subway import get_data_subway
from nishitetsu import get_data_nishitetsu

app = FastAPI()

@app.get('/')
def get_line_data(line: Optional[str] = None):
    if not line: return []
    
    if line == 'T' or line == 'D':
        return get_data_nishitetsu(line)

    return get_data_subway(line)


