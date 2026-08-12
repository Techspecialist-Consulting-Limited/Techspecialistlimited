'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchJobs, type Job } from '@/lib/recruitment-api';
import { supabase } from '@/lib/supabase';
import { BrandedLoader, EmptyState } from '@/components/recruitment';

export default function CareersClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  async function loadJobs() {
    // Try FastAPI backend first, fall back to Supabase
    try {
      const data = await fetchJobs();
      setJobs(data.filter((j) => j.status === 'active' && !j.is_closed));
      setIsLoading(false);
      return;
    } catch { /* FastAPI unavailable, try Supabase */ }

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'active')
          .eq('is_closed', false)
          .order('created_at', { ascending: false });
        if (!error && data) {
          setJobs(data as Job[]);
          setIsLoading(false);
          return;
        }
      }
    } catch { /* Supabase also unavailable */ }

    setJobs([]);
    setIsLoading(false);
  }

  useEffect(() => {
    const progressBar = document.getElementById('scrollProgress');
    const updateScrollProgress = () => {
      if (!progressBar) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    };
    if (progressBar) window.addEventListener('scroll', updateScrollProgress);
    startTransition(() => { loadJobs(); });
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(term) ||
          job.description?.toLowerCase().includes(term),
      );
    }
    if (selectedDepartment) filtered = filtered.filter((j) => j.department === selectedDepartment);
    if (selectedLocation) filtered = filtered.filter((j) => j.location === selectedLocation);
    return filtered;
  }, [jobs, searchTerm, selectedDepartment, selectedLocation]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedLocation('');
  };

  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))].sort();
  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort();

  return (
    <div>
      {/* Scroll Progress */}
      <div className="fixed left-0 top-0 z-[70] h-1 w-full">
        <div className="h-full w-0 bg-[linear-gradient(90deg,#4584ed,#ef6526)] transition-[width] duration-150" id="scrollProgress" />
      </div>

      {/* Slim title bar */}
      <header className="border-b border-gray-200 bg-[var(--bg-soft)] px-6 pb-6 pt-28 dark:border-white/10 dark:bg-white/[0.03] lg:px-8 lg:pt-32">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2">
          <h1 className="font-syne text-xl font-extrabold text-[var(--heading)] sm:text-2xl">Careers</h1>
          <p className="text-sm text-[var(--body)]">
            {jobs.length} position{jobs.length !== 1 ? 's' : ''} open
          </p>
        </div>
      </header>

      {/* Sticky Filter Bar */}
      <section className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/95 lg:px-8">
        <div className="mx-auto grid max-w-[1280px] gap-3 md:grid-cols-[1fr_180px_180px_auto_auto] md:items-end">
          <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
            Search
            <input
              type="search"
              placeholder="Search by title or keyword..."
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-sm normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
            Department
            <select
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-sm normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5 dark:text-white"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
            Location
            <select
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-sm normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5 dark:text-white"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-md border border-[var(--border)] px-4 py-[11px] text-sm font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10 dark:text-white/65"
          >
            Clear
          </button>
          {/* View toggle */}
          <div className="hidden items-center gap-1 rounded-md border border-[var(--border)] p-1 md:flex">
            <button
              onClick={() => setViewMode('grid')}
              className="rounded p-1.5 transition-colors"
              style={{ background: viewMode === 'grid' ? 'var(--blue)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--body)' }}
              aria-label="Grid view"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="rounded p-1.5 transition-colors"
              style={{ background: viewMode === 'list' ? 'var(--blue)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--body)' }}
              aria-label="List view"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <div className="px-6 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-[var(--heading)]">
              Open Positions
            </h2>
            <p className="text-sm text-[var(--body)]">
              {filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''}
            </p>
          </div>

          {isLoading ? (
            <BrandedLoader text="Loading positions..." />
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              icon={
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              }
              title="No positions found"
              description="No positions match your current filters. Try adjusting your search criteria or check back soon for new openings."
              action={{ label: 'Clear Filters', onClick: resetFilters }}
            />
          ) : viewMode === 'grid' ? (
            /* ── Grid View ── */
            <div className="grid gap-5 md:grid-cols-2">
              {filteredJobs.map((job, i) => (
                <Link
                  key={job.id}
                  href={`/careers/${job.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(69,132,237,0.22)] hover:shadow-lg dark:border-white/10 dark:bg-[#101827]"
                  style={{ animation: `cardSlideIn 0.4s ease ${i * 0.08}s both` }}
                >
                  {/* Gradient accent line */}
                  <div className="absolute left-0 right-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--blue),var(--orange))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="p-6">
                    {job.department && (
                      <span className="mb-3 inline-block rounded-full bg-[rgba(69,132,237,0.08)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--blue)]">
                        {job.department}
                      </span>
                    )}
                    <h3 className="mb-2 font-syne text-[17px] font-extrabold leading-tight tracking-[-0.01em] text-[var(--heading)]">
                      {job.title}
                    </h3>
                    {job.description && (
                      <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-[var(--body)]">
                        {job.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {job.type && (
                        <span className="rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--body)] dark:bg-white/5">
                          {job.type}
                        </span>
                      )}
                      {job.location && (
                        <span className="rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--body)] dark:bg-white/5">
                          {job.location}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-[var(--blue)] transition-colors">
                      View Role
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* ── List View ── */
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
              {filteredJobs.map((job, index) => (
                <Link
                  key={job.id}
                  href={`/careers/${job.id}`}
                  className={`group relative block border-b border-[var(--border)] p-6 transition-all hover:bg-[var(--bg-soft)] dark:border-white/10 dark:hover:bg-white/[0.03] ${index === filteredJobs.length - 1 ? 'border-b-0' : ''}`}
                >
                  {/* Left accent on hover */}
                  <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r bg-[linear-gradient(to_bottom,var(--blue),var(--orange))] opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[15px] font-bold text-[var(--heading)]">{job.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {job.department && (
                          <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[10px] font-semibold text-[var(--body)] dark:bg-white/5">{job.department}</span>
                        )}
                        {job.type && (
                          <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${job.type?.toLowerCase() === 'full-time' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {job.type}
                          </span>
                        )}
                        {job.location && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-[var(--body)] dark:bg-white/5">{job.location}</span>
                        )}
                      </div>
                      {job.description && (
                        <p className="mt-3 line-clamp-1 text-[13px] leading-relaxed text-[var(--body)]">{job.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-[var(--blue)]">
                      View
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="transition-transform group-hover:translate-x-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Why Join Us */}
      <section className="border-t border-gray-200 bg-[var(--bg-soft)] px-6 py-14 dark:border-white/10 dark:bg-white/[0.03] lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1280px]">
          <div className="section-tag mb-4">Join Our Team</div>
          <h2 className="section-title mb-5" style={{ maxWidth: 600 }}>
            Build Your Future <em>With Us</em>
          </h2>
          <p className="max-w-xl text-[15px] leading-7 text-[var(--body)]">
            Explore open positions and become part of a team shaping the future of enterprise technology and AI-powered business operations.
          </p>

          <div className="problem-stats-strip mt-8" style={{ maxWidth: 520 }}>
            <div className="pstat">
              <div className="pstat-num">{jobs.length}</div>
              <div className="pstat-label">Open Positions</div>
            </div>
            <div className="pstat">
              <div className="pstat-num">{departments.length}</div>
              <div className="pstat-label">Departments</div>
            </div>
            <div className="pstat">
              <div className="pstat-num">{locations.length}</div>
              <div className="pstat-label">Locations</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
