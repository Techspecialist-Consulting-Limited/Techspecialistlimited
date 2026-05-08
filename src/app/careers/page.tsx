'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Careers() {
  const [jobs, setJobs] = useState<Record<string, any>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setJobs(data);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    }
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

    if (progressBar) {
      window.addEventListener('scroll', updateScrollProgress);
    }

    startTransition(() => { loadJobs(); });

    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(job => job.department === selectedDepartment);
    }

    if (selectedLocation) {
      filtered = filtered.filter(job => job.location === selectedLocation);
    }

    return filtered;
  }, [jobs, searchTerm, selectedDepartment, selectedLocation]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedLocation('');
  };

  const departments = [...new Set(jobs.map(job => job.department).filter(Boolean))].sort();
  const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))].sort();

  return (
    <div>
      {/* Scroll Progress */}
      <div className="fixed left-0 top-0 z-[70] h-1 w-full">
        <div className="h-full w-0 bg-[linear-gradient(90deg,#4584ed,#ef6526)]" id="scrollProgress"></div>
      </div>

      {/* HEADER */}
      <header className="border-b border-gray-200 bg-[#f7f9fc] px-4 py-24 dark:border-white/10 dark:bg-white/[0.03] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#4584ed]">Join Our Team</p>
          <h1 className="font-serif text-5xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-6xl">Build Your Future With Us</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f6368] dark:text-white/60">
            Explore open positions and become part of a team shaping the future of enterprise technology and operations.
          </p>
        </div>
      </header>

      {/* STATS */}
      <section className="border-b border-gray-200 bg-[#f7f9fc] px-4 py-6 dark:border-white/10 dark:bg-white/[0.03] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 sm:grid sm:grid-cols-3">
          <div className="text-center"><div id="stat-positions" className="text-3xl sm:text-4xl font-bold text-[#2f2f2f] dark:text-white">{jobs.length}</div><div className="text-xs sm:text-sm text-[#5f6368] dark:text-white/60">Open Positions</div></div>
          <div className="text-center"><div id="stat-departments" className="text-3xl sm:text-4xl font-bold text-[#2f2f2f] dark:text-white">{departments.length}</div><div className="text-xs sm:text-sm text-[#5f6368] dark:text-white/60">Departments</div></div>
          <div className="text-center"><div id="stat-locations" className="text-3xl sm:text-4xl font-bold text-[#2f2f2f] dark:text-white">{locations.length}</div><div className="text-xs sm:text-sm text-[#5f6368] dark:text-white/60">Locations</div></div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/95 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
            Search
            <input
              id="search-input"
              type="search"
              placeholder="Search by title or keyword"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-white/5 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
            Department
            <select
              id="department-filter"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-white/5 dark:text-white"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept, i) => <option key={i} value={dept}>{dept}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
            Location
            <select
              id="location-filter"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-white/5 dark:text-white"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((loc, i) => <option key={i} value={loc}>{loc}</option>)}
            </select>
          </label>
          <button id="reset-btn" type="button" className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-[#5f6368] hover:border-[#4584ed] hover:text-[#4584ed] dark:border-white/10 dark:text-white/65" onClick={resetFilters}>Clear</button>
        </div>
      </section>

      {/* JOB LISTINGS */}
      <main className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#2f2f2f] dark:text-white">Open Positions</h2>
            <p className="text-sm text-[#5f6368] dark:text-white/60"><span id="job-count">{filteredJobs.length}</span> positions</p>
          </div>
          <div id="job-listings" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#101827]">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No positions match your filters.</div>
            ) : (
              filteredJobs.map((job, index) => (
                <Link key={job.id} href={`/careers/${job.id}`} className={`block border-b border-gray-200 p-6 transition hover:bg-[#f7f9fc] dark:border-white/10 dark:hover:bg-white/[0.03] ${index === filteredJobs.length - 1 ? 'border-b-0' : ''}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#2f2f2f] dark:text-white">{job.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#f7f9fc] px-3 py-1 text-xs font-semibold text-[#5f6368] dark:bg-gray-700 dark:text-gray-300">{job.department}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${job.type?.toLowerCase() === 'full-time' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'}`}>{job.type || 'Full-time'}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-[#5f6368] dark:bg-gray-700 dark:text-gray-300">{job.location}</span>
                      </div>
                      {job.description && <p className="mt-3 text-sm leading-7 text-[#5f6368] dark:text-gray-300">{job.description}</p>}
                    </div>
                    <div className="shrink-0 text-[#4584ed]">→</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
