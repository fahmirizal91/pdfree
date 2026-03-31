// src/pages/RotatePage.tsx
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { Download, Loader2, RotateCw } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function RotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<string[]>([]); // Menyimpan preview gambar halaman
  const [rotations, setRotations] = useState<number[]>([]); // Menyimpan rotasi tiap halaman
  const [processing, setProcessing] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      const previews: string[] = [];
      const initialRotations: number[] = [];

      // Generate preview untuk semua halaman
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 }); // Skala kecil untuk thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport, canvas: canvas }).promise;
        previews.push(canvas.toDataURL());
        initialRotations.push(0); // Rotasi awal 0 derajat
      }

      setPages(previews);
      setRotations(initialRotations);
    } catch (error) {
      alert("Gagal membaca PDF");
    } finally {
      setProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] }, multiple: false, onDrop
  });

  const rotatePage = (index: number) => {
    const newRotations = [...rotations];
    newRotations[index] = (newRotations[index] + 90) % 360; // Putar 90 derajat searah jarum jam
    setRotations(newRotations);
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pdfPages = pdfDoc.getPages();

      // Aplikasikan rotasi ke dokumen asli
      pdfPages.forEach((page, index) => {
        if (rotations[index] !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotations[index]));
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotated_${file.name}`;
      a.click();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
          <RotateCw className="text-indigo-500" size={40} />
          Putar PDF
        </h1>
        <p className="text-gray-600">Putar halaman PDF sesuai keinginan Anda.</p>
      </div>

      {!file ? (
        <div {...getRootProps()} className={`border-4 border-dashed p-20 text-center rounded-3xl cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-200 bg-white hover:border-indigo-400'}`}>
          <input {...getInputProps()} />
          <p className="text-xl font-medium text-gray-700">Tarik & Lepaskan PDF di sini</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg">Klik gambar untuk memutar:</h2>
            <button onClick={handleSave} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
              {processing ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              Simpan & Unduh
            </button>
          </div>

          {/* Grid Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {pages.map((imgSrc, index) => (
              <div key={index} className="flex flex-col items-center gap-3">
                <div 
                  onClick={() => rotatePage(index)}
                  className="relative group cursor-pointer border-2 border-transparent hover:border-indigo-500 rounded-lg p-1 transition-all"
                >
                  <img 
                    src={imgSrc} 
                    alt={`Page ${index + 1}`} 
                    className="w-full shadow-md rounded transition-transform duration-300"
                    style={{ transform: `rotate(${rotations[index]}deg)` }} // Efek visual rotasi
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
                    <RotateCw className="text-white drop-shadow-lg" size={32} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-500">Hal {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}