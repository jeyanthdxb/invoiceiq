from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
from pdf_generator import generate_invoice_pdf

app = FastAPI()

# Allow React frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Item(BaseModel):
    description: str
    quantity: float
    price: float

class InvoiceData(BaseModel):
    invoiceNo: str
    date: str
    business: dict
    client: dict
    items: List[Item]
    total: float

@app.post("/generate-invoice")
def generate_invoice(data: InvoiceData):
    filepath = generate_invoice_pdf(data)
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"{data.invoiceNo}.pdf"
    )