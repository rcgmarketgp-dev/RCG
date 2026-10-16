import React, { useState } from 'react';
import { FilterOptions, CategoryInfo, DeviceStatus } from '../types/device';
import { STATUS_META } from '../data/initialData';
import { 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Percent, 
  Columns3
} from 'lucide-react';

interface AdvancedFilterBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  categories: CategoryInfo[];
  onOpenColumnConfig: () => void;
  filteredCount: number;
  totalCount: number;
}

export const AdvancedFilterBar: React.FC<AdvancedFilterBarProps> = ({
  filters,
  setFilters,
  categories,
  onOpenColumnConfig,
  filteredCount,
  totalCount,
}) => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleStatusChange = (status: 'all' | DeviceStatus) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const handleWarrantyChange = (warrantyMonths: 'all' | 3 | 6 | 9 | 12) => {
    setFilters((prev) => ({ ...prev, warrantyMonths }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'all',
      category: 'all',
      warrantyMonths: 'all',
      minCashPct: 0,
      maxCashPct: 100,
      minPrice: 0,
      maxPrice: 10000000000,
      hasImagesOnly: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.warrantyMonths !== 'all' ||
    filters.maxCashPct < 100 ||
    filters.hasImagesOnly;

  return (
    <div className="bg-white dark:bg-zinc-800/90 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 mb-5 shadow-xs">
      {/* Top row: Search bar + Status chips + Columns button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="جستجوی سریع دستگاه (نام، مدل، برند، سریال، مشخصات فنی، انبار)..."
            className="w-full pl-9 pr-10 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400 transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((p) => ({ ...p, searchQuery: '' }))}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleStatusChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 hover:-translate-y-0.5 active:scale-95 ${
              filters.status === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            همه وضعیت‌ها
          </button>
          <button
            onClick={() => handleStatusChange('ready_for_sale')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 hover:-translate-y-0.5 active:scale-95 ${
              filters.status === 'ready_for_sale'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <span className="w-2 h-2 rounded-xs bg-emerald-400" />
            {STATUS_META.ready_for_sale.label}
          </button>
          <button
            onClick={() => handleStatusChange('under_overhaul')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 hover:-translate-y-0.5 active:scale-95 ${
              filters.status === 'under_overhaul'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <span className="w-2 h-2 rounded-xs bg-amber-400" />
            {STATUS_META.under_overhaul.label}
          </button>
          <button
            onClick={() => handleStatusChange('sold')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 hover:-translate-y-0.5 active:scale-95 ${
              filters.status === 'sold'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-300'
            }`}
          >
            {STATUS_META.sold.label}
          </button>
        </div>

        {/* More Filters Toggle & Columns Config */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              showMoreFilters || isFiltered
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300 shadow-2xs'
                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>فیلتر پیشرفته</span>
            {showMoreFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={onOpenColumnConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            title="شخصی‌سازی و جابجایی ستون‌های جدول"
          >
            <Columns3 className="w-3.5 h-3.5 text-zinc-500" />
            <span>تنظیم ستون‌ها</span>
          </button>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              title="بازنشانی فیلترها"
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips with Distinct Colors: Wrapped for mobile safety */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center gap-1.5 flex-wrap text-xs">
        <span className="text-zinc-400 font-semibold shrink-0 ml-1">دسته‌بندی:</span>
        <button
          onClick={() => handleCategoryChange('all')}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 hover:-translate-y-0.5 active:scale-95 ${
            filters.category === 'all'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
          }`}
        >
          همه دسته‌ها
        </button>
        {categories.map((cat) => {
          const isSelected = filters.category === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.name)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all duration-200 shrink-0 hover:-translate-y-0.5 active:scale-95 ${
                isSelected
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-xs'
                  : `${cat.colorBg} ${cat.colorText} ${cat.colorBorder} hover:opacity-90`
              }`}
            >
              <span
                className="w-2 h-2 rounded-xs"
                style={{ backgroundColor: cat.badgeHex }}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Collapsible Advanced Filters (Warranty, Payment Terms, Sort) */}
      {showMoreFilters && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Warranty Filter */}
          <div>
            <label className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>مدت گارانتی معتبر:</span>
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { val: 'all', label: 'همه' },
                { val: 3, label: '۳ ماهه' },
                { val: 6, label: '۶ ماهه' },
                { val: 9, label: '۹ ماه+' },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => handleWarrantyChange(opt.val as any)}
                  className={`py-1.5 rounded-lg text-center font-medium border transition ${
                    filters.warrantyMonths === opt.val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Terms Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                <Percent className="w-3.5 h-3.5 text-indigo-500" />
                <span>حداکثر پیش‌پرداخت نقد:</span>
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                %{filters.maxCashPct}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.maxCashPct}
              onChange={(e) => setFilters((p) => ({ ...p, maxCashPct: Number(e.target.value) }))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
              <span>۰٪ (تمام اقساط)</span>
              <span>۵۰٪</span>
              <span>۱۰۰٪ (همه)</span>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              مرتب‌سازی بر اساس:
            </label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value as any }))}
                className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
              >
                <option value="createdAt">جدیدترین زمان ثبت</option>
                <option value="name">نام دستگاه (الفبا)</option>
                <option value="price">قیمت پایه</option>
                <option value="warrantyMonths">مدت گارانتی</option>
                <option value="status">وضعیت دستگاه</option>
              </select>
              <button
                onClick={() =>
                  setFilters((p) => ({
                    ...p,
                    sortOrder: p.sortOrder === 'asc' ? 'desc' : 'asc',
                  }))
                }
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              >
                {filters.sortOrder === 'asc' ? 'صعودی' : 'نزولی'}
              </button>
            </div>
          </div>

          {/* Result summary indicator */}
          <div className="flex flex-col justify-end">
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
              <span>تعداد نتایج یافت‌شده:</span>
              <span className="font-black text-sm text-blue-600 dark:text-blue-400">
                {filteredCount} از {totalCount} دستگاه
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
