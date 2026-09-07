from fastapi import FastAPI
from typing import Optional
from subway import get_data_subway

app = FastAPI()

@app.get('/')
def get_line_data(line: Optional[str] = None):
    if not line: return []
    
    if line == 'T' or line == 'D':
        return []

    return get_data_subway(line)


