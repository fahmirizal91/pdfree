// src/pages/JpgToPdfPage.tsx
import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { ImagePlus, Download, Loader2, X, FileImage } from 'lucide-react';

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  // Membuat URL preview sementara untuk gambar yang diunggah
  useEffect(() => {
    const objectUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(objectUrls);
    
    // Membersihkan memori browser saat komponen di-unmount atau files berubah
    return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'] 
    },
    onDrop
  });

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const imageBytes = await file.arrayBuffer();
        let image;

        // Cek tipe gambar untuk menggunakan fungsi embed yang tepat
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          continue; // Lewati jika format tidak didukung
        }

        // Buat halaman PDF dengan ukuran yang sama persis dengan resolusi gambar
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_images_${Date.now()}.pdf`;
      a.click();
      
    } catch (error) {
      console.error(error);
      alert("Gagal membuat PDF. Pastikan file gambar valid.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
          <ImagePlus className="text-teal-500" size={40} />
          JPG ke PDF
        </h1>
        <p className="text-gray-600">
          Ubah gambar JPG dan PNG Anda menjadi dokumen PDF dalam hitungan detik.
        </p>
      </div>

      <div 
        {...getRootProps()} 
        className={`
          border-4 border-dashed p-12 text-center rounded-3xl cursor-pointer transition-all duration-300 mb-8
          ${isDragActive ? 'border-teal-500 bg-teal-50 scale-[1.02]' : 'border-teal-200 bg-white hover:border-teal-400 hover:bg-teal-50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <FileImage className="text-teal-400" size={48} />
          <p className="text-xl font-medium text-gray-700">Tarik & Lepaskan gambar di sini</p>
          <p className="text-sm text-gray-400">Atau klik untuk memilih file (Bisa pilih banyak sekaligus)</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-gray-800">Antrean Gambar ({files.length}):</h2>
            <button 
              onClick={() => setFiles([])}
              className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              Bersihkan Semua
            </button>
          </div>

          {/* Grid Preview Gambar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8 max-h-[400px] overflow-y-auto p-2">
            {files.map((file, index) => (
              <div key={index} className="relative group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden aspect-[3/4] flex items-center justify-center">
                <img 
                  src={previews[index]} 
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay info & hapus saat di-hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-end">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Mencegah memicu dropzone jika diklik
                        removeFile(index);
                      }}
                      className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      title="Hapus gambar ini"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-white text-xs truncate w-full text-center bg-black/50 py-1 rounded">
                    {file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleConvert}
            disabled={processing}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {processing ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
            {processing ? "MEMBUAT PDF..." : "UBAH KE PDF"}
          </button>
        </div>
      )}
    </div>
  );
}