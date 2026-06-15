import { supabase } from './supabase';

export interface SupportTicket {
  id: string;
  user_id: string;
  job_id: string | null;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

/**
 * Fetch support tickets for a user.
 */
export async function getUserTickets(userId: string) {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: data as SupportTicket[], error: null };
}

/**
 * Create a new support ticket.
 */
export async function createTicket(params: {
  userId: string;
  subject: string;
  description: string;
  jobId?: string;
}) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: params.userId,
      subject: params.subject,
      description: params.description,
      job_id: params.jobId || null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  if (data?.id) {
    supabase.functions.invoke('translate-content', {
      body: {
        table: 'support_tickets',
        id: data.id,
        textFields: { 
          subject: params.subject,
          description: params.description 
        }
      }
    }).catch(console.error);
  }

  return { data: data as SupportTicket, error: null };
}
