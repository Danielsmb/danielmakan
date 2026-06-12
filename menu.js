import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Initialize Neon client
    const sql = neon(process.env.DATABASE_URL);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        switch (req.method) {
            case 'GET':
                // Get all menu items
                const menus = await sql`SELECT id, title, info, created_at FROM menu ORDER BY id DESC`;
                return res.status(200).json(menus);
            
            case 'POST':
                // Create new menu
                const { title, info } = req.body;
                if (!title) {
                    return res.status(400).json({ error: 'Title is required' });
                }
                const newMenu = await sql`
                    INSERT INTO menu (title, info) 
                    VALUES (${title}, ${info || ''}) 
                    RETURNING id, title, info, created_at
                `;
                return res.status(201).json(newMenu[0]);
            
            case 'PUT':
                // Update menu
                const { id } = req.query;
                const { title: newTitle, info: newInfo } = req.body;
                
                if (!id) {
                    return res.status(400).json({ error: 'ID is required' });
                }
                
                const updatedMenu = await sql`
                    UPDATE menu 
                    SET title = ${newTitle}, info = ${newInfo || ''}, updated_at = NOW()
                    WHERE id = ${id}
                    RETURNING id, title, info, updated_at
                `;
                
                if (updatedMenu.length === 0) {
                    return res.status(404).json({ error: 'Menu not found' });
                }
                
                return res.status(200).json(updatedMenu[0]);
            
            case 'DELETE':
                // Delete menu
                const { id: deleteId } = req.query;
                
                if (!deleteId) {
                    return res.status(400).json({ error: 'ID is required' });
                }
                
                const deletedMenu = await sql`
                    DELETE FROM menu WHERE id = ${deleteId} RETURNING id
                `;
                
                if (deletedMenu.length === 0) {
                    return res.status(404).json({ error: 'Menu not found' });
                }
                
                return res.status(200).json({ success: true, id: deleteId });
            
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
            error: 'Database error', 
            message: error.message 
        });
    }
}