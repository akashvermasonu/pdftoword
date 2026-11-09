import sys
from pdf2docx import Converter

def convert_pdf_to_word(pdf_path, docx_path):
    try:
        # Converter object banayein
        cv = Converter(pdf_path)
        
        # PDF ke saare pages convert karein
        cv.convert(docx_path, start=0, end=None)
        
        # Converter ko close karein
        cv.close()
        
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("ERROR: Missing arguments")
        sys.exit(1)
        
    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]
    
    convert_pdf_to_word(input_pdf, output_docx)
