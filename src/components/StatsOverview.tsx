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
      {/* Ready for sale */}
      <div className="bg-white dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
            آماده تحویل و فروش
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {ready}
            </span>
            <span className="text-xs text-zinc-400">دستگاه</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* Under overhaul */}
      <div className="bg-white dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
            در حال اورهال و سرویس
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {overhaul}
            </span>
            <span className="text-xs text-zinc-400">دستگاه</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-200">
          <Wrench className="w-5 h-5" />
        </div>
      </div>

      {/* Sold */}
      <div className="bg-white dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xs hover:shadow-md hover:border-zinc-400 dark:hover:border-zinc-500 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
            فروخته شده / تحویل قطعی
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-700 dark:text-zinc-300">
              {sold}
            </span>
            <span className="text-xs text-zinc-400">دستگاه</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-700/60 text-zinc-500 flex items-center justify-center group-hover:scale-110 transition-all duration-200">
          <PackageCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Total inventory value */}
      <div className="bg-white dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between col-span-2 sm:col-span-1">
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
            ارزش موجودی فعال
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
              {(totalValue / 1000000000).toFixed(1)}
            </span>
            <span className="text-xs text-zinc-400">میلیارد تومان</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
          <Coins className="w-5 h-5" />
        </div>
      </div>

      {/* Average installment support */}
      <div className="bg-white dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default group flex items-center justify-between col-span-2 sm:col-span-2 lg:col-span-1">
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
            میانگین فروش اقساطی
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              %{avgInstallment}
            </span>
            <span className="text-xs text-zinc-400">تسهیلات چکی</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-200">
          <Percent className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
