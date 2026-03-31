// src/pages/PdfToJpgPage.tsx
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
// import { Image as ImageIcon, Download, Loader2, FileImage } from 'lucide-react';

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = (acceptedFiles: File[]) => setFile(acceptedFiles[0]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] }, multiple: false, onDrop
  });

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const zip = new JSZip();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Skala besar = Resolusi tinggi
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport, canvas: canvas }).promise;
        
        // Ubah canvas ke base64 image
        const imgData = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        zip.file(`page_${i}.jpg`, imgData, { base64: true });
        
        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_images.zip`;
      a.click();

    } catch (e) {
      alert("Gagal mengonversi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <FileImage className="text-amber-500 mx-auto mb-4" size={48} />
      <h1 className="text-4xl font-bold mb-8">PDF ke JPG</h1>

      {!file ? (
        <div {...getRootProps()} className="border-4 border-dashed border-amber-300 bg-white p-20 rounded-3xl cursor-pointer hover:bg-amber-50">
          <input {...getInputProps()} />
          <p className="text-xl">Pilih File PDF</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl shadow border">
          <p className="text-xl font-bold mb-6">{file.name}</p>
          <button onClick={handleConvert} disabled={processing} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2">
            {processing ? <Loader2 className="animate-spin" /> : <ImageIcon />}
            {processing ? `Mengonversi (${progress}%)` : "UBAH KE JPG"}
          </button>
        </div>
      )}
    </div>
  );
}