// src/pages/Home.tsx
import { Link } from 'react-router-dom';
import { 
  Merge, 
  Scissors, 
  FileDown, 
  FileEdit, 
  RotateCw, 
  FileImage, 
  ImagePlus, 
  FileText 
} from 'lucide-react';

const tools = [
  { title: 'Gabung PDF', desc: 'Gabungkan banyak file PDF menjadi satu.', icon: Merge, path: '/merge', color: 'bg-red-500', hoverText: 'group-hover:text-red-600' },
  { title: 'Pisah PDF', desc: 'Pisahkan halaman PDF dengan mudah.', icon: Scissors, path: '/split', color: 'bg-orange-500', hoverText: 'group-hover:text-orange-600' },
  { title: 'Kompres PDF', desc: 'Kecilkan ukuran file PDF Anda.', icon: FileDown, path: '/compress', color: 'bg-blue-500', hoverText: 'group-hover:text-blue-600' },
  { title: 'Edit PDF Pro', desc: 'Ekstrak dan edit teks PDF layaknya Word.', icon: FileEdit, path: '#', color: 'bg-purple-500', hoverText: 'group-hover:text-purple-600' },
  { title: 'Putar PDF', desc: 'Putar halaman PDF sesuai keinginan Anda.', icon: RotateCw, path: '/rotate', color: 'bg-indigo-500', hoverText: 'group-hover:text-indigo-600' },
  { title: 'PDF ke JPG', desc: 'Ubah setiap halaman PDF menjadi gambar.', icon: FileImage, path: '/pdf-to-jpg', color: 'bg-amber-500', hoverText: 'group-hover:text-amber-600' },
  { title: 'JPG ke PDF', desc: 'Ubah dan gabungkan gambar menjadi PDF.', icon: ImagePlus, path: '/jpg-to-pdf', color: 'bg-teal-500', hoverText: 'group-hover:text-teal-600' },
  { title: 'PDF ke Word', desc: 'Ubah PDF menjadi DOCX (Segera Hadir).', icon: FileText, path: '#', color: 'bg-slate-400', hoverText: 'group-hover:text-slate-600' },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Kelola PDF Anda <span className="text-blue-600">Langsung di Browser</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Aman, cepat, dan gratis. Tidak perlu instalasi aplikasi rumit, dan file Anda diproses langsung di dalam perangkat Anda.
        </p>
      </div>

      {/* TOOLS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool, idx) => {
          // Jika path adalah '#', kita anggap fiturnya belum siap (Coming Soon)
          const isComingSoon = tool.path === '#';

          return (
            <Link 
              key={idx} 
              to={tool.path}
              className={`
                p-6 bg-white border border-gray-100 rounded-3xl shadow-sm transition-all group
                ${isComingSoon ? 'cursor-not-allowed opacity-70 grayscale-[30%]' : 'hover:shadow-xl hover:-translate-y-1'}
              `}
              onClick={(e) => {
                if (isComingSoon) e.preventDefault();
              }}
            >
              <div className={`w-14 h-14 mb-5 flex items-center justify-center rounded-2xl ${tool.color} text-white shadow-sm`}>
                <tool.icon size={28} />
              </div>
              <h3 className={`text-xl font-bold mb-2 transition-colors ${!isComingSoon && tool.hoverText}`}>
                {tool.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {tool.desc}
              </p>
              
              {isComingSoon && (
                <div className="mt-4 inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                  Segera Hadir
                </div>
              )}
            </Link>
          );
        })}
      </div>

    </div>
  );
}