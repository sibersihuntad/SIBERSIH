import Link from "next/link";
import Image from "next/image";
import { CheckSquare, Hourglass, Megaphone, Plus, User } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getValidUserId } from "@/lib/session-user";
import DashboardMapClient from "@/components/DashboardMapClient";
import type { MapReportItem } from "@/components/DashboardMap";
import ReporterDashboardReports from "@/components/ReporterDashboardReports";
import SetPasswordModal from "@/components/SetPasswordModal";
import EmergencyHotline from "@/components/EmergencyHotline";

export default async function PelaporDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const userId = await getValidUserId(session.user);
    if (!userId) redirect("/login");

    const userName = session.user.name || 'Pengguna';

    const [total, completed, recentReports, reporterMapReports] = await Promise.all([
        prisma.report.count({ where: { pelaporId: userId } }),
        prisma.report.count({ where: { pelaporId: userId, status: "SELESAI" } }),
        prisma.report.findMany({
            where: { pelaporId: userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        }),
        prisma.report.findMany({
            where: {
                pelaporId: userId,
                status: { not: "SELESAI" },
                latitude: { not: null },
                longitude: { not: null }
            },
            select: {
                id: true,
                lokasi: true,
                deskripsi: true,
                kategori: true,
                status: true,
                fotoLaporanUrl: true,
                latitude: true,
                longitude: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" },
            take: 50
        })
    ]);

    const mapReports = reporterMapReports as unknown as MapReportItem[];
    const processing = Math.max(0, total - completed);

    return (
        <div className="pb-16 pt-6 sm:pt-8 min-h-screen bg-sibersih-bg flex flex-col max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full">
            <SetPasswordModal />
            {/* HEADER */}
            <header className="flex flex-row justify-between items-center mb-5 sm:mb-8 gap-4 border-b border-sibersih-primary/10 pb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-2xs shrink-0 border border-sibersih-primary/10 bg-white">
                        <Image src="/sibersihLogo.webp" alt="SiBersih" fill className="object-contain" priority sizes="44px" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-sibersih-primary truncate">Halo, {userName}</h1>
                        <p className="text-xs sm:text-sm text-sibersih-primary/60 mt-0.5">Civitas Akademik / Pelapor</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Link
                        href="/reporter/profile"
                        className="p-2 sm:p-2.5 rounded-xl border border-sibersih-primary/10 bg-white hover:bg-sibersih-bg text-sibersih-primary transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 flex items-center justify-center"
                        title="Profil Saya"
                        aria-label="Profil Saya"
                    >
                        <User size={18} className="text-sibersih-primary/80" />
                    </Link>
                    <Link href="/reporter/report" className="hidden sm:flex items-center gap-2 bg-sibersih-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-sibersih-primary/90 transition shadow-xs">
                        <Plus size={16} /> Buat Laporan
                    </Link>
                </div>
            </header>

            {/* RINGKASAN METRIK KHUSUS MOBILE (LINEAR DI ATAS) */}
            <div className="grid grid-cols-3 gap-2 sm:hidden mb-5">
                <div className="bg-white p-2.5 rounded-xl border border-sibersih-primary/10 shadow-2xs flex flex-col items-center text-center">
                    <Megaphone size={16} className="text-sibersih-primary/60 mb-1" />
                    <span className="text-[11px] text-sibersih-primary/60 font-medium">Total</span>
                    <span className="text-base font-bold text-sibersih-primary">{total}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-orange-200/80 shadow-2xs flex flex-col items-center text-center">
                    <Hourglass size={16} className="text-orange-500 mb-1" />
                    <span className="text-[11px] text-orange-700 font-medium">Diproses</span>
                    <span className="text-base font-bold text-orange-900">{processing}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs flex flex-col items-center text-center">
                    <CheckSquare size={16} className="text-emerald-600 mb-1" />
                    <span className="text-[11px] text-emerald-700 font-medium">Selesai</span>
                    <span className="text-base font-bold text-emerald-900">{completed}</span>
                </div>
            </div>
            
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 sm:gap-6 flex-1">
                {/* KOLOM UTAMA (DESKTOP KIRI / MOBILE URUTAN KE-3: SETELAH PETA) */}
                <div className="order-2 lg:order-1 lg:col-span-2 flex flex-col min-h-0">
                    <ReporterDashboardReports 
                        reports={recentReports} 
                        className="max-h-[500px] sm:max-h-[540px] lg:max-h-none lg:h-[580px]"
                    />
                </div>

                {/* KOLOM SEKUNDER (DESKTOP KANAN / MOBILE URUTAN KE-2: SEBELUM LAPORAN TERAKHIR) */}
                <div className="order-1 lg:order-2 lg:col-span-1 flex flex-col gap-5 sm:gap-6 lg:h-[580px]">
                    {/* STATISTIK KHUSUS DESKTOP */}
                    <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-sibersih-primary/10 overflow-hidden shrink-0">
                        <div className="p-4 border-b border-sibersih-primary/5 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-sibersih-primary">Ringkasan Laporan</h2>
                            <Link href="/reporter/history" className="text-xs font-semibold text-sibersih-primary hover:underline">Riwayat</Link>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between p-3 bg-sibersih-bg rounded-lg border border-sibersih-primary/10">
                                <div className="flex items-center gap-3 text-sibersih-primary/80">
                                    <Megaphone size={18} className="text-sibersih-primary/60" />
                                    <span className="text-sm font-medium">Total Laporan</span>
                                </div>
                                <span className="font-semibold text-sibersih-primary">{total}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-50/80 rounded-lg border border-orange-100">
                                <div className="flex items-center gap-3 text-orange-800">
                                    <Hourglass size={18} className="text-orange-500" />
                                    <span className="text-sm font-medium">Sedang Diproses</span>
                                </div>
                                <span className="font-semibold text-orange-900">{processing}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-emerald-50/80 rounded-lg border border-emerald-100">
                                <div className="flex items-center gap-3 text-emerald-800">
                                    <CheckSquare size={18} className="text-emerald-600" />
                                    <span className="text-sm font-medium">Selesai</span>
                                </div>
                                <span className="font-semibold text-emerald-900">{completed}</span>
                            </div>
                        </div>
                    </div>

                    {/* MINIMAP FAKULTAS TEKNIK */}
                    <div className="bg-white rounded-xl shadow-sm border border-sibersih-primary/10 overflow-hidden flex flex-col h-[260px] sm:h-[300px] lg:h-auto lg:flex-1 lg:min-h-0">
                        <div className="p-3.5 sm:p-4 border-b border-sibersih-primary/5 flex justify-between items-center shrink-0">
                            <h2 className="text-xs sm:text-sm font-semibold text-sibersih-primary">Peta Area Pengawasan</h2>
                            <span className="text-[11px] text-sibersih-primary/50">Fakultas Teknik</span>
                        </div>
                        <div className="w-full h-full flex-1 relative z-0 min-h-[190px]">
                            <DashboardMapClient reports={mapReports} />
                        </div>
                    </div>
                </div>
            </div>

            {/* KONTAK DARURAT PEMADAM KEBAKARAN */}
            <div className="mt-6 sm:mt-8">
                <EmergencyHotline />
            </div>

            {/* TOMBOL LAPOR CEPAT MOBILE (LINEAR DI BAWAH LAPORAN TERAKHIR) */}
            <Link
                href="/reporter/report"
                className="sm:hidden flex items-center justify-center gap-2 bg-sibersih-primary text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-sibersih-primary/90 active:scale-[0.99] transition shadow-sm mt-5"
            >
                <Plus size={17} /> Buat Laporan Baru
            </Link>
        </div>
    );
}