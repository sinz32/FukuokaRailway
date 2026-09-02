from fastapi import FastAPI

app = FastAPI()

@app.get('/')
def get_line_data(line: str):
    return []

