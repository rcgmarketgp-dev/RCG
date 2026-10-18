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
  Percent
} from 'lucide-react';

interface AdvancedFilterBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  categories: CategoryInfo[];
  onOpenColumnConfig?: () => void;
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

        {/* Status Dropdown Filter (لیست کشویی وضعیت دستگاه) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0">وضعیت دستگاه:</span>
          <div className="relative min-w-[170px] sm:min-w-[200px]">
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value as 'all' | DeviceStatus)}
              className="w-full px-3 py-2 pr-8 pl-8 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer appearance-none transition shadow-2xs hover:border-zinc-300"
            >
              <option value="all">همه وضعیت‌ها (کل موجودی)</option>
              <option value="ready_for_sale">🟢 {STATUS_META.ready_for_sale.label}</option>
              <option value="under_overhaul">🟡 {STATUS_META.under_overhaul.label}</option>
              <option value="sold">⚪ {STATUS_META.sold.label}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* More Filters Toggle */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              showMoreFilters || isFiltered
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300 shadow-2xs'
                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>فیلتر پیشرفته</span>
            {showMoreFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              title="بازنشانی فیلترها"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Dropdown Filter (لیست کشویی دسته‌بندی انبار) */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400 font-bold shrink-0">دسته‌بندی دستگاه‌ها:</span>
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <select
              value={filters.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 pl-8 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer appearance-none transition"
            >
              <option value="all">همه دسته‌ها (کل موجودی)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {filters.category !== 'all' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">دسته‌بندی فعال:</span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {filters.category}
            </span>
            <button
              onClick={() => handleCategoryChange('all')}
              className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline"
            >
              نمایش همه
            </button>
          </div>
        )}
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
