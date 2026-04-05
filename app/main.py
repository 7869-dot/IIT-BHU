import fastapi


app = fastapi(
    title = "IIT-BHU",
    description = "IIT-BHU API",
    version = "1.0.0"
    )

@app.get("/")
def read_root():
    return {"Hello": "World"}
