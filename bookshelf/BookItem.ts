import { supabaseClient } from "../auth/supabaseAuth";

export type TableName = 'AgentBullet' | 'DetectiveRonny' | 'ShortStories' | 'Poems';

export interface IBookItem {
    title: string;
    filename: string;
    description: string | null;
    show: boolean;

    getInfoHTML(): string;
}

// Raw shape coming back from Supabase before it's wrapped in a class
interface BookRow {
    title: string;
    filename: string;
    description: string | null;
    show: boolean;
    date?: string | null;
}

abstract class BaseBookItem implements IBookItem {
    constructor(
        public title: string,
        public filename: string,
        public description: string | null,
        public show: boolean
    ) {}

    abstract getInfoHTML(): string;

    protected descriptionHTML(): string {
        return `<p>${this.description ? this.description : ''}</p>`;
    }
}

export class AgentBulletItem extends BaseBookItem {
    getInfoHTML(): string {
        return `<strong><u>${this.title}</u></strong> ${this.descriptionHTML()}`;
    }
}

/** Shared base for every item that also carries a date (short stories, poems, Detective Ronny). */
export abstract class DatedBookItem extends BaseBookItem {
    constructor(
        title: string,
        filename: string,
        description: string | null,
        show: boolean,
        public date: Date | null
    ) {
        super(title, filename, description, show);
    }

    getInfoHTML(): string {
        const yearText = this.date ? ` (${this.date.getFullYear()})` : '';
        return `<strong><u>${this.title}${yearText}</u></strong> ${this.descriptionHTML()}`;
    }
}

export class DetectiveRonnyItem extends DatedBookItem {}
export class ShortStoryItem extends DatedBookItem {}
export class PoemItem extends DatedBookItem {}

function toDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
}

/**
 * Queries the given table and returns typed IBookItem instances.
 * Mirrors the old per-table branching, but centralizes it in one place.
 */
export async function queryItems(
    tableName: TableName
): Promise<{ items: IBookItem[]; error: { message: string } | null }> {
    const baseQuery = supabaseClient.from(tableName);

    const query =
        tableName === 'AgentBullet'
            ? baseQuery
                  .select('title, filename, description, show')
                  .order('title', { ascending: true })
                  .eq('show', true)
            : baseQuery
                  .select('title, filename, description, show, date')
                  .order('date', { ascending: true })
                  .eq('show', true);

    const { data, error } = await query;

    if (error) {
        return { items: [], error };
    }

    const rows = (data ?? []) as BookRow[];

    let items: IBookItem[];
    switch (tableName) {
        case 'AgentBullet':
            items = rows.map(
                (r) => new AgentBulletItem(r.title, r.filename, r.description, r.show)
            );
            break;
        case 'DetectiveRonny':
            items = rows.map(
                (r) =>
                    new DetectiveRonnyItem(r.title, r.filename, r.description, r.show, toDate(r.date))
            );
            break;
        case 'ShortStories':
            items = rows.map(
                (r) => new ShortStoryItem(r.title, r.filename, r.description, r.show, toDate(r.date))
            );
            break;
        case 'Poems':
            items = rows.map(
                (r) => new PoemItem(r.title, r.filename, r.description, r.show, toDate(r.date))
            );
            break;
    }

    return { items, error: null };
}
