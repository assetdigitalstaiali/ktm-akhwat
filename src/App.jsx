import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, Upload, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, LogOut,
  Loader2, AlertCircle, User, Lock, Heart, FileImage, CreditCard } from 'lucide-react';

/**
 * HELPER: Safe Environment Variable Access
 * Mengambil variabel dari .env secara aman tanpa membuat aplikasi crash
 */
const getEnv = (key, defaultValue) => {
  try {
    // Cek apakah import.meta.env tersedia (Standar Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {
    // Abaikan error di environment yang tidak mendukung import.meta
  }
  return defaultValue;
};

/**
 * KONFIGURASI APLIKASI
 */
const CONFIG = {
  API_BASE: 'https://lokal.stai-ali.ac.id/db_api/',

  CREDENTIALS: { 
    u: getEnv('VITE_LOGIN_USER', ''), 
    p: getEnv('VITE_LOGIN_PASS', '') 
  }, 
  
  // Path gambar
  LOGIN_BANNER: '/login.png', 
  APP_LOGO: '/logo.png', // Logo untuk Header
  
  // Asset Kartu
  CARD_IMG_FRONT: '/KARTU_FRONT.png',
  CARD_IMG_REAR: '/KARTU_REAR.png',

  CARD: {
    w: 85.6,
    // UPDATE: Tinggi disesuaikan ke 135.6mm agar proporsional dengan CR-80 Portrait (54x86mm)
    // saat width diset 85.6mm. (Rasio 1.58)
    h: 135.6, 
    photo: { x: 28, y: 54, w: 27.5, h: 37, radius: 2 }
  }
};

/**
 * HELPER FUNCTIONS
 */
const generateToken = () => {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = String(now.getFullYear()).slice(-2);
  const d = String(now.getDate()).padStart(2, '0');
  return `51${m}${y}${d}55`;
};

// Generate Dynamic Angkatan (Current Year down to 2022)
const getDynamicAngkatan = () => {
  const currentYearFull = new Date().getFullYear();
  const minYear = 2022; // TAHUN MULAI TETAP
  const years = [];
  
  for (let y = currentYearFull; y >= minYear; y--) {
    years.push(String(y).slice(-2));
  }
  return years;
};

const fetchStudents = async (tahun, nama = '') => {
  const token = generateToken();
  const params = new URLSearchParams({ q: token, t: tahun });
  if (nama) params.append('n', nama);

  try {
    const response = await fetch(`${CONFIG.API_BASE}?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const json = await response.json();
    const rawData = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);
    
    return rawData.map(item => ({
      nim: item.nim || item.NIM || '-',
      nama: item.namamhs || item.nama || '-',
      fakultas: 'TARBIYAH', 
      prodi: 'PEND. BAHASA ARAB', 
      angkatan: tahun
    }));
  } catch (err) {
    console.error("Fetch Error:", err);
    throw err;
  }
};

/**
 * MAIN COMPONENT
 */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState('search'); 
  const [selectedStudent, setSelectedStudent] = useState(null);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navbar Hijau */}
      <nav className="bg-emerald-500 text-white px-6 py-3 shadow-lg shadow-emerald-500/20 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
          {/* LOGO HEADER diganti Image */}
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <img 
              src={CONFIG.APP_LOGO} 
              alt="Logo" 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'; // Sembunyikan jika gambar rusak
                e.target.nextSibling.style.display = 'block'; // Tampilkan icon search fallback
              }}
            />
            {/* Fallback jika logo.png tidak ditemukan */}
            <Search size={24} className="text-white hidden" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Pencarian KTM Mahasiswi
          </h1>
        </div>
        
        <button 
          onClick={() => setIsLoggedIn(false)} 
          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
        >
          <LogOut size={16}/> Logout
        </button>
      </nav>

      {/* Konten Utama */}
      <main className="p-0 md:p-6 print:p-0">
        {viewMode === 'search' ? (
          <SearchPage 
            onSelect={(student) => {
              setSelectedStudent(student);
              setViewMode('print');
            }} 
          />
        ) : (
          <PrintPage 
            student={selectedStudent} 
            onBack={() => {
              setViewMode('search');
              setSelectedStudent(null);
            }} 
          />
        )}
      </main>
    </div>
  );
}

/**
 * HALAMAN LOGIN
 */
function LoginPage({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Try fix cek
    const serverUser = CONFIG.CREDENTIALS.u;
    const serverPass = CONFIG.CREDENTIALS.p;

    // 1. Jika Secret Kosong (Belum diset di Codespace/Repo), tolak akses
    if (!serverUser || !serverPass) {
      setErr('Konfigurasi Keamanan Server (Secret) belum diset. Hubungi Administrator.');
      return;
    }

    // 2. Cek Username & Password
    if (u === serverUser && p === serverPass) {
      onLogin();
    } else {
      setErr('Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-100 overflow-hidden w-full max-w-4xl flex flex-col md:flex-row min-h-[550px]">
        
        {/* Kolom Kiri: Banner Image */}
        <div className="w-full md:w-1/2 bg-emerald-50 flex items-center justify-center p-8 md:p-12 relative overflow-hidden">
           {/* Dekorasi Background */}
           <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-emerald-200 rounded-full opacity-20 blur-3xl"></div>
           <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-green-300 rounded-full opacity-20 blur-3xl"></div>
           
           {/* Gambar Banner */}
           <div className="relative z-10 text-center">
             <img 
              src={CONFIG.LOGIN_BANNER} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none'; 
              }}
              alt="Cetak KTM Banner" 
              className="max-w-full h-auto drop-shadow-xl mx-auto hover:scale-105 transition duration-500"
            />
             <div className="hidden first:block mt-4 text-emerald-800 font-bold text-xl">
               Aplikasi Cetak KTM Digital
             </div>
           </div>
        </div>

        {/* Kolom Kanan: Form Login */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              Ahlan wa Sahlan <Heart size={24} className="text-emerald-500 fill-emerald-500" />
            </h2>
            <p className="text-slate-500">Silakan login untuk memulai pencarian data & pencetakan KTM.</p>
          </div>
          
          {err && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 text-sm rounded-r flex items-center gap-3 animate-pulse">
              <AlertCircle size={18}/> {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition" size={20} />
              <input 
                type="text" 
                placeholder="Username"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                value={u} 
                onChange={e => setU(e.target.value)} 
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition" size={20} />
              <input 
                type="password" 
                placeholder="Password"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                value={p} 
                onChange={e => setP(e.target.value)} 
              />
            </div>

            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0">
              MASUK APLIKASI
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Aplikasi Digital Percetakan Kartu KTM Mahasiswi
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              &copy; {new Date().getFullYear()} Kemudahan Percetakan Berbasis Digital
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/**
 * HALAMAN PENCARIAN
 */
function SearchPage({ onSelect }) {
  const [angkatan, setAngkatan] = useState('');
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isBaakError, setIsBaakError] = useState(false);

  const dynamicAngkatan = getDynamicAngkatan();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!angkatan) return;
    
    setLoading(true); 
    setError(null); 
    setIsBaakError(false);
    setResults(null);
    
    try {
      const data = await fetchStudents(angkatan, nama);
      
      if (data.length === 0) {
        setIsBaakError(true);
        setError("Data tidak tersedia saat ini. Harap hubungi BAAK, akan kami update secara berkala dalam database kami.");
      } else {
        setResults(data);
      }
    } catch (err) {
      setError("Gagal mengambil data. Pastikan koneksi aman (CORS) atau coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-emerald-500 px-6 py-4 border-b border-emerald-600">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Search size={20} className="opacity-80"/> Filter Data Mahasiswi
          </h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Angkatan</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer"
                value={angkatan}
                onChange={(e) => setAngkatan(e.target.value)}
                required
              >
                <option value="">— Tahun Angkatan —</option>
                {dynamicAngkatan.map(a => <option key={a} value={a}>Angkatan 20{a}</option>)}
              </select>
            </div>
            <div className="md:col-span-7">
              <label className="block text-sm font-bold text-slate-700 mb-1">Nama Mahasiswi (Opsional)</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="Cari nama..."
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/20 transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>}
                CARI DATA
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className={`p-6 rounded-2xl border flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300 ${isBaakError ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <AlertCircle size={24} className={`shrink-0 ${isBaakError ? 'text-amber-600' : 'text-red-600'}`}/> 
          <div>
            <h4 className="font-bold text-lg mb-1">{isBaakError ? 'Mohon Maaf' : 'Terjadi Kesalahan'}</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {results !== null && results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-700">Hasil Pencarian</h3>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">{results.length} ditemukan</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 border-b border-slate-100 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">NIM</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4 hidden md:table-cell">Fakultas</th>
                  <th className="px-6 py-4 hidden md:table-cell">Prodi</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30 transition duration-150">
                      <td className="px-6 py-4 font-bold text-slate-700">{r.nim}</td>
                      <td className="px-6 py-4 font-medium">{r.nama}</td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-500">{r.fakultas}</td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-500">{r.prodi}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => onSelect(r)}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <Printer size={14}/> CETAK
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HALAMAN PREVIEW & CETAK
 */
function PrintPage({ student, onBack }) {
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [photo, setPhoto] = useState(null);
  // STATE BARU: Switcher Depan/Belakang
  const [cardSide, setCardSide] = useState('front'); // 'front' | 'rear'
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const nudge = (dx, dy) => {
    setOx(prev => Number((prev + dx).toFixed(1)));
    setOy(prev => Number((prev + dy).toFixed(1)));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const step = e.shiftKey ? 0.5 : 0.2;
      if (e.key === 'ArrowUp') { e.preventDefault(); nudge(0, -step); }
      if (e.key === 'ArrowDown') { e.preventDefault(); nudge(0, step); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-step, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(step, 0); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cardStyle = {
    '--card-w': `${CONFIG.CARD.w}mm`,
    '--card-h': `${CONFIG.CARD.h}mm`,
    '--ox': `${ox}mm`,
    '--oy': `${oy}mm`,
    '--photo-x': `calc(${CONFIG.CARD.photo.x}mm + var(--ox))`,
    '--photo-y': `calc(${CONFIG.CARD.photo.y}mm + var(--oy))`,
    '--photo-w': `${CONFIG.CARD.photo.w}mm`,
    '--photo-h': `${CONFIG.CARD.photo.h}mm`,
    '--photo-r': `${CONFIG.CARD.photo.radius}mm`,
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center print:hidden">
        <button onClick={onBack} className="text-slate-500 hover:text-emerald-600 flex items-center gap-2 font-bold transition">
          <ArrowLeft size={18}/> Kembali
        </button>

        {/* FITUR BARU: Switcher Sisi Kartu di Header Mobile/Desktop */}
        <div className="flex bg-white border border-emerald-100 rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setCardSide('front')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${cardSide === 'front' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CreditCard size={16}/> Sisi Depan
          </button>
          <button 
            onClick={() => setCardSide('rear')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${cardSide === 'rear' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileImage size={16}/> Sisi Belakang
          </button>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Printer size={20}/> PRINT (Ctrl+P)
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start print:block print:p-0">
        <div className="relative print:m-0 print:absolute print:top-0 print:left-0">
          <style>{`
            .card-area {
              width: var(--card-w); height: var(--card-h);
              position: relative; background: #fff;
              border-radius: 6mm; overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .card-bg { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
            .card-photo {
              position: absolute; left: var(--photo-x); top: var(--photo-y);
              width: var(--photo-w); height: var(--photo-h);
              border-radius: var(--photo-r); object-fit: cover;
              border: 1mm solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.25); background: #ddd;
            }
            .card-txt {
              position: absolute; width: 100%; color: #ffffff;
              text-transform: uppercase; letter-spacing: 0.25px; mix-blend-mode: normal;
              text-shadow: -0.6px -0.6px 0 rgba(0,0,0,.85), 0.6px -0.6px 0 rgba(0,0,0,.85), -0.6px 0.6px 0 rgba(0,0,0,.85), 0.6px 0.6px 0 rgba(0,0,0,.85);
            }
            @supports (-webkit-text-stroke: 1px black) {
              .card-txt { text-shadow: none; -webkit-text-stroke: 0.6px rgba(0,0,0,.85); }
            }
            @media print {
              body { background: white; margin: 0; }
              .card-area { box-shadow: none; border-radius: 0; margin: 0; }
              @page { margin: 0; size: auto; }
            }
          `}</style>

          <div className="card-area" style={cardStyle}>
            {cardSide === 'front' ? (
              // === TAMPILAN DEPAN ===
              <>
                <img src={CONFIG.CARD_IMG_FRONT} alt="KTM Depan" className="card-bg" onError={(e) => e.target.style.display='none'} />
                {photo ? (
                  <img src={photo} className="card-photo" alt="Foto Siswa" />
                ) : (
                  <div className="card-photo flex items-center justify-center text-xs text-gray-500 text-center p-2 bg-slate-200">No Photo</div>
                )}
                <div className="card-txt" style={{ top: `calc(95mm + var(--oy))`, textAlign: 'center', fontSize: '3.8mm', fontWeight: 800 }}>{student.nim}</div>
                <div className="card-txt" style={{ top: `calc(100mm + var(--oy))`, textAlign: 'center', fontSize: '3.6mm', fontWeight: 800 }}>{student.nama}</div>
                <div className="card-txt" style={{ top: `calc(105mm + var(--oy))`, textAlign: 'center', fontSize: '3.2mm', fontWeight: 700 }}>{student.fakultas}</div>
                <div className="card-txt" style={{ top: `calc(110mm + var(--oy))`, textAlign: 'center', fontSize: '3.2mm', fontWeight: 700 }}>{student.prodi}</div>
              </>
            ) : (
              // === TAMPILAN BELAKANG ===
              <>
                <img src={CONFIG.CARD_IMG_REAR} alt="KTM Belakang" className="card-bg" onError={(e) => e.target.style.display='none'} />
                {/* Biasanya bagian belakang hanya gambar tata tertib/barcode statis tanpa biodata overlay */}
              </>
            )}
          </div>
          
          <p className="mt-4 text-center text-xs text-slate-400 font-medium print:hidden">
            Pratinjau: <b>{cardSide === 'front' ? 'Sisi Depan' : 'Sisi Belakang'}</b>
          </p>
        </div>

        {/* SIDEBAR KONTROL (Hanya muncul jika Sisi Depan yang dipilih) */}
        {cardSide === 'front' ? (
          <div className="w-full md:w-80 space-y-6 print:hidden">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Upload size={16} className="text-emerald-500"/> Upload Foto
              </h4>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-400 transition group"
              >
                {photo ? (
                  <div className="space-y-3">
                    <img src={photo} className="w-24 h-32 object-cover mx-auto rounded-lg shadow-md group-hover:scale-105 transition" />
                    <p className="text-xs text-emerald-600 font-bold bg-emerald-100 inline-block px-2 py-1 rounded">Ganti Foto</p>
                  </div>
                ) : (
                  <div className="text-slate-400 py-4">
                    <User className="mx-auto mb-2 text-emerald-200" size={32}/>
                    <p className="text-sm font-medium text-slate-600">Klik cari foto</p>
                    <p className="text-[10px] mt-1 text-slate-400">(Format JPG/PNG)</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Kalibrasi</h4>
                <button onClick={() => { setOx(0); setOy(0); }} title="Reset" className="text-slate-400 hover:text-emerald-500 transition bg-slate-100 p-1.5 rounded-md">
                  <RotateCcw size={14}/>
                </button>
              </div>
              <div className="bg-slate-800 text-emerald-400 p-3 rounded-lg mb-4 text-center font-mono text-sm tracking-widest border border-slate-700 shadow-inner">
                X: {ox} <span className="text-slate-600">|</span> Y: {oy}
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-[160px] mx-auto">
                <div></div>
                <button onClick={() => nudge(0, -0.5)} className="p-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-500 hover:text-white transition shadow-sm active:scale-95 flex justify-center"><ArrowUp size={18}/></button>
                <div></div>
                <button onClick={() => nudge(-0.5, 0)} className="p-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-500 hover:text-white transition shadow-sm active:scale-95 flex justify-center"><ArrowLeft size={18}/></button>
                <div className="flex items-center justify-center text-slate-300"><Printer size={16}/></div>
                <button onClick={() => nudge(0.5, 0)} className="p-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-500 hover:text-white transition shadow-sm active:scale-95 flex justify-center"><ArrowRight size={18}/></button>
                <div></div>
                <button onClick={() => nudge(0, 0.5)} className="p-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-500 hover:text-white transition shadow-sm active:scale-95 flex justify-center"><ArrowDown size={18}/></button>
                <div></div>
              </div>
            </div>
          </div>
      ) : (
          <div className="w-full md:w-80 space-y-6 print:hidden flex items-center justify-center text-slate-400 text-sm italic border-l pl-6">
            Fitur edit (foto & kalibrasi) hanya tersedia untuk sisi depan kartu.
          </div>
        )}
      </div>
    </div>
  );
}