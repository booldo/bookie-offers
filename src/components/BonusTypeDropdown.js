"use client";
import { useState, useRef, useEffect } from "react";

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

  // Filtered options
  const filtered = search
    ? options.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Toggle selection
  function toggle(name) {
    if (selected.includes(name)) {
      setSelected(selected.filter((n) => n !== name));
    } else {
      setSelected([...selected, name]);
    }
  }

  // Toggle category expansion
  function toggleCategory(categoryName) {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  }

  const dropdownContent = (
    <div className="overflow-y-auto max-h-[calc(80vh-6rem)] sm:max-h-full">
          {!nested && (
            <div className="px-3 pb-2 pt-1 sticky top-0 bg-white z-10">
              <input
                type="text"
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
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
                        <label key={sub.name} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                          <input
                            type="checkbox"
                            checked={selected.includes(sub.name)}
                            onChange={() => toggle(sub.name)}
                            className="accent-green-600 w-4 h-4 rounded"
                          />
                          <span className="flex-1 text-gray-800 text-sm">{sub.name}</span>
                          {showCount && sub.count !== undefined && (
                            <span className="text-gray-400 text-xs font-semibold">{sub.count}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Regular flat structure
              filtered.map((b) => (
                <label key={b.name} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    checked={selected.includes(b.name)}
                    onChange={() => toggle(b.name)}
                    className="accent-green-600 w-4 h-4 rounded"
                  />
                  <span className="flex-1 text-gray-800 text-sm">{b.name}</span>
                  {showCount && b.count !== undefined && (
                    <span className="text-gray-400 text-xs font-semibold">{b.count}</span>
                  )}
                </label>
              ))
            )}
          </div>
    </div>
  );

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        className="w-full bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-2 text-left text-xs sm:text-sm flex items-center justify-between shadow-sm hover:border-gray-300 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate text-gray-700">
          {selected.length === 0 ? label : selected.join(", ")}
        </span>
        <svg className={`ml-1 sm:ml-2 w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
      </button>

      {/* Mobile slide-up panel */}
      <div
        className={`
          sm:hidden fixed bottom-0 left-0 right-0 rounded-t-2xl p-4
          bg-white shadow-2xl border-t border-black z-20
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
        <div className="hidden sm:block absolute z-20 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in">
          {dropdownContent}
        </div>
      )}
    </div>
  );
} 