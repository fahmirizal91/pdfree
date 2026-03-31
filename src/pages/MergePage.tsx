import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Merge, Download, Loader2 } from 'lucide-react';

export default function MergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    onDrop: (acceptedFiles) => setFiles((prev) => [...prev, ...acceptedFiles])
  });

  const handleMerge = async () => {
    if (files.length < 2) {
      alert("Pilih minimal 2 file PDF untuk digabungkan!");
      return;
    }
    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `merged_${Date.now()}.pdf`;
      link.click();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menggabungkan PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
          <Merge className="text-red-600" size={40} /> Gabungkan PDF
        </h1>
        <p className="text-gray-600">Gabungkan banyak file PDF menjadi satu dokumen utuh.</p>
      </div>

      <div 
        {...getRootProps()} 
        className="border-4 border-dashed border-red-200 bg-white p-16 text-center rounded-3xl cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all"
      >
        <input {...getInputProps()} />
        <p className="text-xl font-medium text-gray-700">
          Tarik & Lepaskan file PDF di sini
        </p>
        <p className="text-sm text-gray-400 mt-2">atau klik untuk menelusuri komputer Anda</p>
      </div>

      {files.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Antrean File ({files.length}):</h2>
          <div className="flex flex-col gap-2 mb-6">
            {files.map((file, index) => (
              <div key={index} className="px-4 py-3 bg-gray-50 rounded-lg flex justify-between items-center text-sm font-medium text-gray-700">
                <span>{index + 1}. {file.name}</span>
                <span className="text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleMerge}
            disabled={loading}
            className="w-full bg-red-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
            {loading ? "Memproses..." : "GABUNGKAN PDF"}
          </button>
        </div>
      )}
    </div>
  );
}