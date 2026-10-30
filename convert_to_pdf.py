import win32com.client
import os
import sys

def convert_docx_to_pdf(docx_path, pdf_path):
    abs_docx = os.path.abspath(docx_path)
    abs_pdf = os.path.abspath(pdf_path)
    
    print(f"Opening Word to convert {abs_docx} -> {abs_pdf}...")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    
    try:
        doc = word.Documents.Open(abs_docx)
        print("Document opened. Updating fields and Table of Contents...")
        
        # Update TOC and fields if present
        try:
            for toc in doc.TablesOfContents:
                toc.Update()
            for field in doc.Fields:
                field.Update()
        except Exception as e:
            print("Note on field update:", e)
            
        print("Exporting as PDF (wdFormatPDF = 17)...")
        # 17 represents wdExportFormatPDF / wdFormatPDF
        doc.ExportAsFixedFormat(abs_pdf, 17)
        doc.Close(False)
        print("PDF export successful!")
    except Exception as e:
        print("Error during conversion:", e)
        raise
    finally:
        word.Quit()

if __name__ == "__main__":
    convert_docx_to_pdf("CareerConnect_Mini_Project_Report.docx", "CareerConnect_Mini_Project_Report.pdf")
