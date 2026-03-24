// BuildQuest: Leaderboard API — Supabase REST wrapper

// ── Supabase config ──
// These are safe to embed: RLS restricts to read + insert only
const SUPABASE_URL = 'https://qcblhgrxumhakbzctcdz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Um37BxGO-5D90vJ_ZO_jhQ_dfBot9jn';
const CHECKSUM_SALT = 'bq-dispatch-dash-2026';

class LeaderboardAPI {
    constructor() {
        this.baseUrl = `${SUPABASE_URL}/rest/v1`;
        this.headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        };
        this._lastSubmitTime = 0;
    }

    isConfigured() {
        return !SUPABASE_URL.includes('placeholder');
    }

    async generateChecksum(data) {
        const payload = `${data.score}|${data.jobs_completed}|${data.waves_completed}|${data.best_streak}|${data.character}|${CHECKSUM_SALT}`;
        try {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch {
            let hash = 0;
            for (let i = 0; i < payload.length; i++) {
                const char = payload.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0;
            }
            return Math.abs(hash).toString(16);
        }
    }

    /**
     * Submit a score to the leaderboard.
     * Uses upsert_score RPC (keeps best score per player+company) when available,
     * falls back to plain INSERT for backwards compatibility.
     * Rejects submissions with no company name.
     * @returns {{ ok: boolean, data?: object, error?: string }}
     */
    async submitScore({ playerName, company, score, tier, character, jobsCompleted, wavesCompleted, bestStreak }) {
        const now = Date.now();
        if (now - this._lastSubmitTime < 3000) {
            return { ok: false, error: 'Please wait before submitting again' };
        }
        this._lastSubmitTime = now;

        if (!this.isConfigured()) {
            console.warn('[LeaderboardAPI] Supabase not configured — score not submitted');
            return { ok: false, error: 'Leaderboard not configured' };
        }

        const cleanCompany = this._normalizeCompany(company);
        if (!cleanCompany) {
            return { ok: false, error: 'Company name is required to submit a score' };
        }

        const row = {
            player_name:    (playerName || '').trim().slice(0, 20),
            company:        cleanCompany,
            score:          Math.max(0, Math.floor(score)),
            tier:           tier || 'Apprentice',
            character:      character || 'hvac',
            jobs_completed: Math.max(0, Math.floor(jobsCompleted || 0)),
            waves_completed:Math.max(0, Math.floor(wavesCompleted || 0)),
            best_streak:    Math.max(0, Math.floor(bestStreak || 0)),
        };
        row.checksum = await this.generateChecksum(row);

        // Try upsert_score RPC first (migration_leaderboard_v2.sql must be applied)
        try {
            const rpcRes = await fetch(`${this.baseUrl}/rpc/upsert_score`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    p_player_name:     row.player_name,
                    p_company:         row.company,
                    p_score:           row.score,
                    p_tier:            row.tier,
                    p_character:       row.character,
                    p_jobs_completed:  row.jobs_completed,
                    p_waves_completed: row.waves_completed,
                    p_best_streak:     row.best_streak,
                    p_checksum:        row.checksum,
                }),
            });

            if (rpcRes.ok) {
                const data = await rpcRes.json();
                return { ok: true, data };
            }
            // Non-404 error from RPC (deployed but something went wrong)
            if (rpcRes.status !== 404) {
                const errText = await rpcRes.text().catch(() => 'Unknown error');
                console.error('[LeaderboardAPI] upsert_score RPC failed:', rpcRes.status, errText);
                return { ok: false, error: `Server error: ${rpcRes.status}` };
            }
            // 404 = RPC not deployed yet, fall through to plain INSERT
            console.warn('[LeaderboardAPI] upsert_score RPC not found — falling back to INSERT');
        } catch (err) {
            console.warn('[LeaderboardAPI] upsert_score RPC error, falling back:', err);
        }

        // Fallback: plain INSERT (allows duplicate player entries)
        try {
            const res = await fetch(`${this.baseUrl}/scores`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(row),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => 'Unknown error');
                console.error('[LeaderboardAPI] Submit failed:', res.status, errText);
                return { ok: false, error: `Server error: ${res.status}` };
            }

            const data = await res.json();
            return { ok: true, data: data[0] || data };
        } catch (err) {
            console.error('[LeaderboardAPI] Network error:', err);
            return { ok: false, error: 'Network error — check your connection' };
        }
    }

    /**
     * Fetch top individual scores (all-time).
     * Fetches extra rows and deduplicates by player_name, keeping each player's
     * best score only. (Once upsert_score is live, DB already has one row per
     * player, so this is a cheap safety net.)
     * @returns {{ ok: boolean, data?: Array, error?: string }}
     */
    async getTopTechsAllTime(limit = 25) {
        if (!this.isConfigured()) {
            return { ok: true, data: this._getMockTechs(limit) };
        }

        try {
            const params = new URLSearchParams({
                select: 'id,player_name,company,score,tier,character,best_streak,waves_completed,created_at',
                order:  'score.desc',
                limit:  String(limit * 4), // fetch extra to survive deduplication
            });

            const res = await fetch(`${this.baseUrl}/scores?${params}`, {
                headers: this.headers,
            });

            if (!res.ok) {
                return { ok: false, error: `Server error: ${res.status}` };
            }

            const rows = await res.json();

            // Deduplicate: one entry per player_name, keeping highest score
            // (rows are already sorted desc, so first occurrence = best)
            const seen = new Set();
            const data = [];
            for (const row of rows) {
                if (!seen.has(row.player_name)) {
                    seen.add(row.player_name);
                    data.push(row);
                }
                if (data.length >= limit) break;
            }

            return { ok: true, data };
        } catch (err) {
            console.error('[LeaderboardAPI] Fetch techs error:', err);
            return { ok: false, error: 'Network error' };
        }
    }

    /**
     * Fetch top companies (all-time).
     * Uses get_top_companies RPC (server-side aggregation) when available,
     * falls back to client-side aggregation over a bounded fetch.
     * Empty company names are excluded in both paths.
     * @returns {{ ok: boolean, data?: Array, error?: string }}
     */
    async getTopCompaniesAllTime(limit = 10) {
        if (!this.isConfigured()) {
            return { ok: true, data: this._getMockCompanies(limit) };
        }

        // Try server-side RPC first (migration_leaderboard_v2.sql must be applied)
        try {
            const rpcRes = await fetch(`${this.baseUrl}/rpc/get_top_companies`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ lim: limit }),
            });

            if (rpcRes.ok) {
                const data = await rpcRes.json();
                return { ok: true, data };
            }
            if (rpcRes.status !== 404) {
                return { ok: false, error: `Server error: ${rpcRes.status}` };
            }
            console.warn('[LeaderboardAPI] get_top_companies RPC not found — falling back to client aggregation');
        } catch (err) {
            console.warn('[LeaderboardAPI] get_top_companies RPC error, falling back:', err);
        }

        // Fallback: client-side aggregation
        try {
            const params = new URLSearchParams({
                select: 'player_name,company,score,character',
                order:  'score.desc',
                limit:  '500',
                company: 'neq.', // exclude empty company via PostgREST filter
            });

            const res = await fetch(`${this.baseUrl}/scores?${params}`, {
                headers: this.headers,
            });

            if (!res.ok) {
                return { ok: false, error: `Server error: ${res.status}` };
            }

            const scores = await res.json();

            const companyMap = {};
            scores.forEach(s => {
                if (!s.company) return; // extra guard for empty/null
                if (!companyMap[s.company]) {
                    companyMap[s.company] = {
                        company: s.company,
                        total_score: 0,
                        unique_players: new Set(),
                        best_score: 0,
                        top_player: null,
                        top_character: null,
                    };
                }
                const c = companyMap[s.company];
                c.total_score += s.score;
                c.unique_players.add(s.player_name);
                if (s.score > c.best_score) {
                    c.best_score = s.score;
                    c.top_player = s.player_name;
                    c.top_character = s.character;
                }
            });

            const data = Object.values(companyMap)
                .map(c => ({ ...c, unique_players: c.unique_players.size }))
                .sort((a, b) => b.total_score - a.total_score)
                .slice(0, limit);

            return { ok: true, data };
        } catch (err) {
            console.error('[LeaderboardAPI] Fetch companies error:', err);
            return { ok: false, error: 'Network error' };
        }
    }

    // ── Helpers ──

    // Normalize company name: trim whitespace and title-case each word.
    // "buildops" → "Buildops", "build ops" → "Build Ops"
    // Keeps intentional mixed-case like "BuildOps" intact since we only
    // capitalize the first letter of each word if it was lowercase.
    _normalizeCompany(company) {
        return (company || '')
            .trim()
            .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1))
            .slice(0, 30);
    }

    // ── Mock data ──

    _getMockTechs(limit) {
        const names = [
            { name: 'Mike R.',  company: 'Acme HVAC',  score: 187400, tier: 'Superintendent', character: 'hvac' },
            { name: 'Sarah K.', company: 'TechServ',   score: 142300, tier: 'Superintendent', character: 'electrician' },
            { name: 'Jake M.',  company: 'BuildCo',    score: 98700,  tier: 'Foreman',        character: 'plumber' },
            { name: 'Lisa T.',  company: 'Acme HVAC',  score: 76200,  tier: 'Foreman',        character: 'pm' },
            { name: 'Dave P.',  company: 'ProPlumb',   score: 54100,  tier: 'Lead Tech',      character: 'plumber' },
            { name: 'Kim W.',   company: 'TechServ',   score: 43800,  tier: 'Lead Tech',      character: 'electrician' },
            { name: 'Tom B.',   company: 'BuildCo',    score: 31200,  tier: 'Lead Tech',      character: 'hvac' },
            { name: 'Ana G.',   company: 'CoolAir',    score: 22500,  tier: 'Journeyman',     character: 'pm' },
            { name: 'Rob N.',   company: 'FixIt Inc',  score: 15800,  tier: 'Journeyman',     character: 'hvac' },
            { name: 'Jen S.',   company: 'ProPlumb',   score: 8200,   tier: 'Journeyman',     character: 'plumber' },
        ];
        return names.slice(0, limit).map((n, i) => ({
            id: `mock-${i}`,
            player_name: n.name,
            company: n.company,
            score: n.score,
            tier: n.tier,
            character: n.character,
            best_streak: Math.floor(Math.random() * 12) + 1,
            waves_completed: Math.floor(Math.random() * 8) + 1,
            created_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        }));
    }

    _getMockCompanies(limit) {
        const companies = [
            { company: 'Acme HVAC',  total_score: 412500, unique_players: 3, best_score: 187400, top_player: 'Mike R.',  top_character: 'hvac' },
            { company: 'TechServ',   total_score: 286100, unique_players: 2, best_score: 142300, top_player: 'Sarah K.', top_character: 'electrician' },
            { company: 'BuildCo',    total_score: 198400, unique_players: 3, best_score: 98700,  top_player: 'Jake M.',  top_character: 'plumber' },
            { company: 'ProPlumb',   total_score: 124300, unique_players: 2, best_score: 54100,  top_player: 'Dave P.',  top_character: 'plumber' },
            { company: 'CoolAir',    total_score: 68200,  unique_players: 2, best_score: 22500,  top_player: 'Ana G.',   top_character: 'pm' },
            { company: 'FixIt Inc',  total_score: 42100,  unique_players: 1, best_score: 15800,  top_player: 'Rob N.',   top_character: 'hvac' },
        ];
        return companies.slice(0, limit);
    }
}

const leaderboardAPI = new LeaderboardAPI();
export default leaderboardAPI;
