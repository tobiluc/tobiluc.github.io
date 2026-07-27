// import { supabaseClient } from "/auth/supabaseAuth";

// export interface IBookItem
// {
//     title: string;
//     filename: string;
//     description: string | null;

//     getTooltipHTML(): string;
// };

// export class AgentBulletItem implements IBookItem
// {
//     constructor(
//         public title: string,
//         public filename: string,
//         public description: string | null
//     ) {}

//     getTooltipHTML(): string {
//         return `<strong>${this.title}</strong> <p>${this.description ? this.description : ''}</p>`;  
//     }
// };

// export class DetectiveRonnyItem implements IBookItem
// {
//     constructor(
//         public title: string,
//         public filename: string,
//         public description: string | null,
//         public date: Date | null
//     ) {}

//     getTooltipHTML(): string
//     {
//         const yearText = this.date ? ` (${new Date(this.date).getFullYear()})` : '';
//         return `<strong>${this.title}</strong>${yearText} <p>${this.description ? this.description : ''}</p>`; 
//     }
// };

// export class ShortStoryItem implements IBookItem
// {
//     constructor(
//         public title: string,
//         public filename: string,
//         public description: string | null,
//         public date: Date | null
//     ) {}

//     getTooltipHTML(): string
//     {
//         const yearText = this.date ? ` (${new Date(this.date).getFullYear()})` : '';
//         return `<strong>${this.title}</strong>${yearText} <p>${this.description ? this.description : ''}</p>`;
//     }
// };

// export class PoemItem implements IBookItem
// {
//     constructor(
//         public title: string,
//         public filename: string,
//         public description: string | null,
//         public date: Date | null
//     ) {}

//     getTooltipHTML(): string
//     {
//         const yearText = this.date ? ` (${new Date(this.date).getFullYear()})` : '';
//         return `<strong>${this.title}</strong>${yearText} <p>${this.description ? this.description : ''}</p>`;
//     }
// };

// export async function queryItems(tableName: 'AgentBullet' | 'DetectiveRonny' | 'ShortStories' | 'Poems')
// {
//     if (tableName == 'AgentBullet')
//     {
//         const { data: stories, error } = await supabaseClient
//             .from(tableName)
//             .select('title, filename, description')
//             .order('title');

//         if (error) {console.error(error);}

//         return { stories, error };
//         // return data.map(
//         //     (row) =>
//         //         new AgentBulletItem(
//         //             row.title,
//         //             row.filename,
//         //             row.description
//         //         )
//         // );
//     }
//     else if (tableName == 'DetectiveRonny')
//     {
//         const { data: stories, error } = await supabaseClient
//             .from(tableName)
//             .select('title, filename, description, date')
//             .order('date', { ascending: true });

//         if (error) {console.error(error);}

//         return { stories, error };
//     }
//     else if (tableName == 'ShortStories')
//     {
//         const { data: stories, error } = await supabaseClient
//             .from(tableName)
//             .select('title, filename, description, date')
//             .order('date', { ascending: true });

//         if (error) {console.error(error);}

//         return { stories, error };
//     }
//     else if (tableName == 'Poems')
//     {
//         const { data: stories, error } = await supabaseClient
//             .from(tableName)
//             .select('title, filename, description, date')
//             .order('date', { ascending: true });

//         if (error) {console.error(error);}

//         return { stories, error };
//     }
// }