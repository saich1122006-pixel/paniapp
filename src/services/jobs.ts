// ============================================================================
// Jobs Service
// CRUD operations and geo queries for the jobs table
// ============================================================================

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Job {
  id: string;
  recruiter_id: string;
  work_name: string;
  voice_note_url: string | null;
  payment_amount: number;
  estimated_hours: number | null;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  job_location: any;
  location_address: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  recruiter?: {
    full_name: string;
    phone_number: string;
  };
  worker?: {
    full_name: string;
    phone_number: string;
  };
  distance_km?: number;
}

/**
 * Fetch nearby open jobs within a radius (in km).
 * Uses PostGIS ST_DWithin for efficient geo queries.
 */
export async function getNearbyJobs(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  workerSkills?: string[],
  minAmount: number = 0
) {
  // Use Supabase RPC for spatial queries (defined in 00014 migration)
  const { data, error } = await supabase.rpc('get_filtered_jobs_v2', {
    worker_lat: latitude,
    worker_lng: longitude,
    radius_meters: radiusKm * 1000,
    search_query: null,
    min_wage: minAmount,
    worker_skills: workerSkills && workerSkills.length > 0 ? workerSkills : null,
  });

  if (error) {
    console.error('RPC failed, using fallback:', error);
    // Fallback: fetch all open jobs without geo filter
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('jobs')
      .select('*, recruiter:profiles!recruiter_id(full_name, phone_number)')
      .eq('status', 'open')
      .gte('payment_amount', minAmount)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fallbackError) return { data: [], error: fallbackError.message };

    // Apply skill-based filtering client-side for the fallback
    let filtered = fallbackData || [];
    if (workerSkills && workerSkills.length > 0) {
      filtered = filtered.filter((job: any) =>
        workerSkills.some((skill) =>
          job.work_name?.toLowerCase().includes(skill.toLowerCase())
        )
      );
    }
    return { data: filtered, error: null };
  }

  return { data: (data as any)?.results || [], error: null };
}

/**
 * Fetch jobs posted by a recruiter.
 */
export async function getRecruiterJobs(recruiterId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, worker:profiles!accepted_by(full_name, phone_number)')
    .eq('recruiter_id', recruiterId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data || [], error: null };
}

/**
 * Fetch jobs accepted by a worker.
 */
export async function getWorkerJobs(workerId: string) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, recruiter:profiles!recruiter_id(full_name, phone_number)')
      .eq('accepted_by', workerId)
      .order('accepted_at', { ascending: false });

    if (error) throw error;
    
    // Cache the jobs list
    if (data) {
      await AsyncStorage.setItem(`@worker_jobs_${workerId}`, JSON.stringify(data));
    }
    
    return { data: data || [], error: null, fromCache: false };
  } catch (err: any) {
    console.log('Network error fetching worker jobs, falling back to cache:', err.message);
    try {
      const cached = await AsyncStorage.getItem(`@worker_jobs_${workerId}`);
      if (cached) {
        return { data: JSON.parse(cached), error: null, fromCache: true };
      }
    } catch (cacheErr) {
      console.error('Error reading from cache:', cacheErr);
    }
    return { data: [], error: err.message || 'Failed to fetch jobs' };
  }
}

/**
 * Get a single job by ID.
 */
export async function getJob(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(
        '*, recruiter:profiles!recruiter_id(full_name, phone_number), worker:profiles!accepted_by(full_name, phone_number)'
      )
      .eq('id', jobId)
      .single();

    if (error) throw error;

    // Cache the job details
    if (data) {
      await AsyncStorage.setItem(`@job_${jobId}`, JSON.stringify(data));
    }
    
    return { data, error: null, fromCache: false };
  } catch (err: any) {
    console.log('Network error fetching job details, falling back to cache:', err.message);
    try {
      const cached = await AsyncStorage.getItem(`@job_${jobId}`);
      if (cached) {
        return { data: JSON.parse(cached), error: null, fromCache: true };
      }
    } catch (cacheErr) {
      console.error('Error reading from cache:', cacheErr);
    }
    return { data: null, error: err.message || 'Failed to load job details' };
  }
}

/**
 * Post a new job.
 */
export async function createJob(params: {
  recruiterId: string;
  workName: string;
  paymentAmount: number;
  estimatedHours?: number;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  voiceNoteUrl?: string;
}) {
  const insertData: Record<string, any> = {
    recruiter_id: params.recruiterId,
    work_name: params.workName,
    payment_amount: params.paymentAmount,
    estimated_hours: params.estimatedHours || null,
    location_address: params.locationAddress || null,
    voice_note_url: params.voiceNoteUrl || null,
  };

  // Set job location as PostGIS geography point
  if (params.latitude && params.longitude) {
    insertData.job_location = `POINT(${params.longitude} ${params.latitude})`;
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert(insertData)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Update an existing job.
 */
export async function updateJob(
  jobId: string,
  params: {
    workName: string;
    paymentAmount: number;
    estimatedHours?: number;
    latitude?: number;
    longitude?: number;
    locationAddress?: string;
  }
) {
  const updateData: Record<string, any> = {
    work_name: params.workName,
    payment_amount: params.paymentAmount,
    estimated_hours: params.estimatedHours || null,
  };

  if (params.locationAddress !== undefined) {
    updateData.location_address = params.locationAddress;
  }

  // Update job location if provided
  if (params.latitude && params.longitude) {
    updateData.job_location = `POINT(${params.longitude} ${params.latitude})`;
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Worker accepts a job.
 */
export async function acceptJob(jobId: string, workerId: string) {
  const { error } = await supabase
    .from('jobs')
    .update({
      accepted_by: workerId,
      accepted_at: new Date().toISOString(),
      status: 'matched',
    })
    .eq('id', jobId)
    .eq('status', 'open'); // Only if still open

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Worker drops an accepted job.
 */
export async function workerDropJob(jobId: string, workerId: string) {
  const { error } = await supabase
    .from('jobs')
    .update({
      accepted_by: null,
      accepted_at: null,
      status: 'open',
    })
    .eq('id', jobId)
    .eq('accepted_by', workerId)
    .eq('status', 'matched'); // Only if it's currently matched to them

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Mark a job as completed.
 */
export async function completeJob(jobId: string) {
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'completed' })
    .eq('id', jobId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Cancel a job.
 */
export async function cancelJob(jobId: string) {
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Delete a job.
 */
export async function deleteJob(jobId: string) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
