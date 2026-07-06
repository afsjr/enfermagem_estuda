/**
 * Telemetry Service for MonicAI
 * 
 * Envia métricas de uso anônimas para o Supabase sem coletar dados pessoais (PII).
 */

export interface StudentProfile {
  courseSemester: string; // ex: '1º Módulo'
  moduleInterest: string; // ex: 'Urgência e UTI'
}

class TelemetryService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private anonymousId: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    let anonId = localStorage.getItem('monicai_anon_id');
    if (!anonId) {
      anonId = this.generateUUID();
      localStorage.setItem('monicai_anon_id', anonId);
    }
    this.anonymousId = anonId;
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  saveProfile(profile: StudentProfile): void {
    localStorage.setItem('monicai_profile', JSON.stringify(profile));
    
    this.logEvent({
      actionType: 'onboarding_completed',
      actionDetail: `Semestre: ${profile.courseSemester} | Interesse: ${profile.moduleInterest}`
    });
  }

  getProfile(): StudentProfile | null {
    const saved = localStorage.getItem('monicai_profile');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  async logEvent(params: {
    actionType: string;
    screenName?: string;
    actionDetail?: string;
    durationSeconds?: number;
  }): Promise<void> {
    const isPlaceholder = 
      !this.supabaseUrl || 
      !this.supabaseAnonKey || 
      this.supabaseUrl.includes('seu-projeto') || 
      this.supabaseAnonKey.includes('sua_chave_anon_publica');

    if (isPlaceholder) {
      // Ignora silenciosamente se o Supabase estiver com credenciais fictícias
      return;
    }

    const profile = this.getProfile();

    try {
      const payload = {
        anonymous_id: this.anonymousId,
        course_semester: profile?.courseSemester || 'Não Informado',
        module_interest: profile?.moduleInterest || 'Não Informado',
        screen_name: params.screenName || '',
        action_type: params.actionType,
        action_detail: params.actionDetail || '',
        duration_seconds: params.durationSeconds || null
      };

      // Limita tempo limite para não travar a UI caso a rede caia
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);

      await fetch(`${this.supabaseUrl}/rest/v1/csm_telemetry`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseAnonKey,
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(id);
    } catch (error) {
      // Falha silenciosa para telemetria para não atrapalhar o fluxo do aluno
      console.warn('Falha no registro da telemetria (erro ignorado para UX):', error);
    }
  }
}

export const telemetry = new TelemetryService();
