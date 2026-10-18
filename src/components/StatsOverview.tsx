import React from 'react';
import { DeviceItem } from '../types/device';
import { CheckCircle2, Wrench, PackageCheck, Coins, Percent } from 'lucide-react';

interface StatsOverviewProps {
  devices: DeviceItem[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ devices }) => {
  const total = devices.length;
  const ready = devices.filter((d) => d.status === 'ready_for_sale').length;
  const overhaul = devices.filter((d) => d.status === 'under_overhaul').length;
  const sold = devices.filter((d) => d.status === 'sold').length;

  const totalValue = devices
    .filter((d) => d.status !== 'sold' && d.price)
    .reduce((sum, d) => sum + (d.price || 0), 0);

  const avgInstallment = total > 0
    ? Math.round(devices.reduce((sum, d) => sum + (d.installmentPercentage || 0), 0) / total)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-5">
      {/* Ready for sale (Card 1) */}
      <div 
        style={{ height: '66px' }}
        className="bg-white dark:bg-zinc-800/80 px-3.5 py-2 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between overflow-hidden"
      >
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5 leading-tight">
            آماده تحویل و فروش
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
              {ready}
            </span>
            <span className="text-[11px] text-zinc-400">دستگاه</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

      {/* Under overhaul (Card 2) */}
      <div 
        style={{ height: '66px' }}
        className="bg-white dark:bg-zinc-800/80 px-3.5 py-2 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between overflow-hidden"
      >
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5 leading-tight">
            در حال اورهال و سرویس
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 leading-none">
              {overhaul}
            </span>
            <span className="text-[11px] text-zinc-400">دستگاه</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-200 shrink-0">
          <Wrench className="w-4 h-4" />
        </div>
      </div>

      {/* Sold (Card 3) */}
      <div 
        style={{ height: '66px', width: '251px', maxWidth: '100%' }}
        className="bg-white dark:bg-zinc-800/80 px-3.5 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xs hover:shadow-md hover:border-zinc-400 dark:hover:border-zinc-500 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between overflow-hidden"
      >
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5 leading-tight">
            فروخته شده / تحویل قطعی
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-zinc-700 dark:text-zinc-300 leading-none">
              {sold}
            </span>
            <span className="text-[11px] text-zinc-400">دستگاه</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-700/60 text-zinc-500 flex items-center justify-center group-hover:scale-110 transition-all duration-200 shrink-0">
          <PackageCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Total inventory value (Card 4) */}
      <div 
        style={{ height: '66px', width: '250px', maxWidth: '100%' }}
        className="bg-white dark:bg-zinc-800/80 px-3.5 py-2 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between col-span-2 sm:col-span-1 overflow-hidden"
      >
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5 leading-tight">
            ارزش موجودی فعال
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-blue-600 dark:text-blue-400 leading-none">
              {(totalValue / 1000000000).toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-400">میلیارد تومان</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 shrink-0">
          <Coins className="w-4 h-4" />
        </div>
      </div>

      {/* Average installment support (Card 5) */}
      <div 
        style={{ width: '251px', height: '63px', maxWidth: '100%' }}
        className="bg-white dark:bg-zinc-800/80 px-3.5 py-2 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between col-span-2 sm:col-span-2 lg:col-span-1 overflow-hidden"
      >
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5 leading-tight">
            میانگین فروش اقساطی
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
              %{avgInstallment}
            </span>
            <span className="text-[11px] text-zinc-400">تسهیلات چکی</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-200 shrink-0">
          <Percent className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
