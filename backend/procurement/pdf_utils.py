from django.template.loader import render_to_string
from weasyprint import HTML
import tempfile
import os

def generate_po_pdf(po, company_name="Your Company", company_address="Your Address"):
    """Generate PDF bytes for a PurchaseOrder"""
    html_string = render_to_string('pdf/purchase_order.html', {
        'po': po,
        'company_name': company_name,
        'company_address': company_address,
    })
    html = HTML(string=html_string)
    pdf_bytes = html.write_pdf()
    return pdf_bytes


def save_po_pdf_locally(po):
    """Save PDF to local media folder (used before S3 on Day 23)"""
    pdf_bytes = generate_po_pdf(po)
    media_dir = 'media/po_pdfs'
    os.makedirs(media_dir, exist_ok=True)
    file_path = f"{media_dir}/{po.po_number}.pdf"
    with open(file_path, 'wb') as f:
        f.write(pdf_bytes)
    return file_path