// src/pages/AdvancedEditPage.tsx
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { FileEdit, Loader2, Save, XCircle } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

// Setup Worker PDF.js (Sama seperti di file Compress & Split)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function AdvancedEditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  // FUNGSI BARU: Baca teks PDF langsung di Frontend!
  const onDrop = async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setProcessing(true);
    setStatusText('Mengekstrak teks di dalam browser...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let extractedHtml = '';

      // Looping untuk membaca setiap halaman PDF
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        let lastY = -1;

        // Menyusun teks dan mendeteksi baris baru (Enter)
        textContent.items.forEach((item: any) => {
          if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 5) {
            pageText += '<br/>'; // Beri jarak jika kordinat Y berubah (ganti baris)
          }
          pageText += item.str;
          lastY = item.transform[5];
        });

        // Masukkan teks halaman ini ke dalam paragraf
        extractedHtml += `<p>${pageText}</p><br/>`;
      }

      setHtmlContent(extractedHtml);

    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat membaca dokumen PDF.');
      setFile(null);
    } finally {
      setProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop
  });

  // FUNGSI INI TETAP MENGGUNAKAN BACKEND (Puppeteer untuk merakit PDF)
  const handleSaveToPdf = async () => {
    setProcessing(true);
    setStatusText('Mencetak dokumen menjadi PDF...');

    try {
      // Panggil backend hanya untuk mencetak HTML menjadi PDF
      const response = await fetch('http://localhost:3001/api/html-to-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!response.ok) throw new Error("Gagal membuat PDF dari Backend");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Edited_${file?.name || 'document.pdf'}`;
      a.click();

    } catch (error) {
      console.error(error);
      alert('Gagal mengekspor ke PDF. Pastikan backend server menyala.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
          <FileEdit className="text-purple-500" size={40} />
          Editor Teks PDF
        </h1>
        <p className="text-gray-600">
          Ekstrak teks dari PDF, edit sesuka hati, dan simpan kembali menjadi PDF.
        </p>
      </div>

      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-4 border-dashed p-20 text-center rounded-3xl cursor-pointer transition-all
            ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50'}
          `}
        >
          <input {...getInputProps()} />
          {processing ? (
            <div className="flex flex-col items-center gap-4 text-purple-600">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-xl font-medium">{statusText}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-xl font-medium text-gray-700">Tarik & Lepaskan PDF di sini</p>
              <p className="text-sm text-gray-400">Atau klik untuk memilih file</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden relative">
          
          {processing && (
            <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center text-purple-600 backdrop-blur-sm">
               <Loader2 className="animate-spin mb-4" size={48} />
               <p className="text-xl font-bold">{statusText}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <div className="font-semibold text-gray-700 truncate max-w-sm" title={file.name}>
              {file.name}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setFile(null); setHtmlContent(''); }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                disabled={processing}
              >
                <XCircle size={18} /> Tutup
              </button>
              <button 
                onClick={handleSaveToPdf}
                disabled={processing}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all shadow-sm"
              >
                <Save size={18} /> Simpan & Unduh PDF
              </button>
            </div>
          </div>

          <div className="p-0 bg-white">
            <ReactQuill 
              theme="snow" 
              value={htmlContent} 
              onChange={setHtmlContent} 
              className="min-h-[500px] border-none text-lg"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ 'color': [] }, { 'background': [] }],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'align': [] }],
                  ['clean']
                ],
              }}
            />
          </div>

        </div>
      )}
    </div>
  );
}