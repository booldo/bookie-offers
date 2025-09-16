"use client";
import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";

// Memoized checkbox item component to prevent unnecessary re-renders
const CheckboxItem = memo(({ item, selected, onToggle, showCount }) => (
  <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
    <input
      type="checkbox"
      checked={selected.includes(item.name)}
      onChange={() => onToggle(item.name)}
      className="accent-[#018651] w-4 h-4 rounded"
    />
    <div className="flex items-center gap-2 flex-1">
      <span className="align-middle text-[#272932] text-[14px] leading-[24px] font-medium font-['General_Sans']">{item.name}</span>
    {showCount && item.count !== undefined && (
      <span className="text-gray-400 text-xs font-semibold">{item.count}</span>
    )}
    </div>
  </label>
));

CheckboxItem.displayName = 'CheckboxItem';

export default function MultiSelectDropdown({ label, options, selected, setSelected, showCount = false, nested = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const ref = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Memoized filtered options
  const filtered = useMemo(() => {
    return search
      ? options.filter((b) => b.name && b.name.toLowerCase().includes(search.toLowerCase()))
      : options;
  }, [options, search]);

  // Toggle selection
  const toggle = useCallback((name) => {
    if (selected.includes(name)) {
      setSelected(selected.filter((n) => n !== name));
    } else {
      setSelected([...selected, name]);
    }
  }, [selected, setSelected]);

  // Toggle category expansion
  const toggleCategory = useMemo(() => (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  }, []);

  // Memoized dropdown content
  const dropdownContent = useMemo(() => (
    <div className="overflow-y-auto max-h-[calc(80vh-6rem)] sm:max-h-full">
      {!nested && (
        <div className="px-3 pb-2 pt-1 sticky top-0 bg-[#FFFFFF] z-10">
          <div className="relative">
            <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          <input
            type="text"
              className="w-full rounded-md border border-gray-200 pl-8 pr-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 px-1">
        {!nested && filtered.length === 0 && (
          <div className="text-gray-400 text-sm px-3 py-2">No results</div>
        )}
        {nested ? (
          // Nested structure with collapsible categories
          options.map((category) => (
            <div key={category.name} className="border-b border-gray-100 last:border-b-0">
              <button
                type="button"
                className="w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between hover:bg-gray-50 transition"
                onClick={() => toggleCategory(category.name)}
              >
                {category.name}
                <svg 
                  className={`w-3 h-3 transition-transform ${expandedCategories[category.name] ? "rotate-180" : ""}`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedCategories[category.name] && (
                <div className="pl-2">
                  {category.subcategories?.map((sub) => (
                    <CheckboxItem
                      key={sub.name}
                      item={sub}
                      selected={selected}
                      onToggle={toggle}
                      showCount={showCount}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          // Regular flat structure
          filtered.map((b) => (
            <CheckboxItem
              key={b.name}
              item={b}
              selected={selected}
              onToggle={toggle}
              showCount={showCount}
            />
          ))
        )}
      </div>
    </div>
  ), [nested, search, filtered, options, expandedCategories, selected, toggle, toggleCategory, showCount]);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        className="w-full bg-[#F5F5F7] border border-gray-200 rounded-2xl px-2 sm:px-3 py-2 text-left flex items-center justify-between shadow-sm hover:border-gray-300 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate align-middle text-[#272932] text-[14px] leading-[24px] font-medium font-['General_Sans']">
          {label}
          {/* {selected.length > 0 && (
            <span className="ml-1 bg-[#018651] text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
              {selected.length}
            </span>
          )} */}
        </span>
        <svg className={`ml-1 sm:ml-2 w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
      </button>

      {/* Mobile slide-up panel */}
      <div
        className={`
          sm:hidden fixed bottom-0 left-0 right-0 rounded-t-2xl p-4
          bg-[#FFFFFF] shadow-2xl border-t border-gray-200 z-20
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="sm:hidden flex justify-between items-center pb-2 mb-3">
          <h3 className="font-semibold text-lg">{label}</h3>
          <button onClick={() => setOpen(false)} className="p-1">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {dropdownContent}
      </div>

      {/* Desktop dropdown panel */}
      {open && (
        <div className="hidden sm:block absolute z-20 mt-2 w-64 bg-[#FFFFFF] rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in">
          {dropdownContent}
        </div>
      )}
    </div>
  );
} 