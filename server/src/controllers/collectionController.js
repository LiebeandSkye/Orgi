import { supabase } from "../services/supabase.js"; 
 
export const collectionController = { 
  async getCollection(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { status } = req.query; 
 
      let query = supabase 
        .from("user_collections") 
        .select(` 
          id, 
          status, 
          created_at, 
          items ( 
            id, 
            external_id, 
            provider, 
            type, 
            title, 
            cover_url 
          ) 
        `) 
        .eq("user_id", userId) 
        .order("created_at", { ascending: false }); 
 
      if (status && ["plan", "progress", "completed"].includes(status)) { 
        query = query.eq("status", status); 
      } 
 
      const { data, error } = await query; 
      if (error) throw error; 
 
      const formatted = (data || []).map((entry) => { 
        const item = Array.isArray(entry.items) ? entry.items[0] : (entry.items || {}); 
        return { 
          id: entry.id, 
          status: entry.status, 
          createdAt: entry.created_at, 
          updatedAt: entry.updated_at || entry.created_at, 
          itemId: item.id, 
          externalId: item.external_id, 
          provider: item.provider, 
          type: item.type, 
          title: item.title, 
          coverUrl: item.cover_url, 
        }; 
      }); 
 
      res.json({ success: true, data: formatted }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
 
  async checkStatus(req, res, next) { 
    try { 
      const { provider, externalId } = req.params; 
      const userId = req.user?.id; 
 
      if (!userId) { 
        return res.json({ 
          success: true, 
          data: { inCollection: false, status: null, itemId: null } 
        }); 
      } 
 
      const { data: item } = await supabase 
        .from("items") 
        .select("id") 
        .eq("provider", provider) 
        .eq("external_id", String(externalId)) 
        .maybeSingle(); 
 
      if (!item) { 
        return res.json({ 
          success: true, 
          data: { inCollection: false, status: null, itemId: null } 
        }); 
      } 
 
      const { data: collectionEntry } = await supabase 
        .from("user_collections") 
        .select("id, status") 
        .eq("user_id", userId) 
        .eq("item_id", item.id) 
        .maybeSingle(); 
 
      res.json({ 
        success: true, 
        data: { 
          inCollection: !!collectionEntry, 
          status: collectionEntry?.status || null, 
          itemId: item.id, 
        } 
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

 
  async toggleItem(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { external_id, provider, type, title, cover_url } = req.body; 
 
      if (!external_id || !provider || !type || !title) { 
        return res.status(400).json({ 
          error: { message: "Missing required item fields", code: "VALIDATION_ERROR" } 
        }); 
      } 
 
      let { data: item } = await supabase 
        .from("items") 
        .select("id") 
        .eq("type", type) 
        .eq("provider", provider) 
        .eq("external_id", String(external_id)) 
        .maybeSingle(); 
 
      if (!item) { 
        const { data: newItem, error: itemError } = await supabase 
          .from("items") 
          .insert({ 
            external_id: String(external_id), 
            provider, 
            type, 
            title, 
            cover_url: cover_url || null, 
          }) 
          .select("id") 
          .single(); 
 
        if (itemError) throw itemError; 
        item = newItem; 
      } 
 
      const { data: existingEntry } = await supabase 
        .from("user_collections") 
        .select("id") 
        .eq("user_id", userId) 
        .eq("item_id", item.id) 
        .maybeSingle(); 
 
      if (existingEntry) { 
        const { error: delError } = await supabase 
          .from("user_collections") 
          .delete() 
          .eq("id", existingEntry.id); 
 
        if (delError) throw delError; 
 
        return res.json({ 
          success: true, 
          data: { inCollection: false, status: null, itemId: item.id } 
        }); 
      } 
 
      const { data: newEntry, error: insertError } = await supabase 
        .from("user_collections") 
        .insert({ 
          user_id: userId, 
          item_id: item.id, 
          status: "plan", 
        }) 
        .select("id, status") 
        .single(); 
 
      if (insertError) throw insertError; 
 
      res.json({ 
        success: true, 
        data: { inCollection: true, status: newEntry.status, itemId: item.id } 
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
 
  async updateStatus(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { itemId } = req.params; 
      const { status } = req.body; 
 
      if (!["plan", "progress", "completed"].includes(status)) { 
        return res.status(400).json({ 
          error: { message: "Invalid status value", code: "VALIDATION_ERROR" } 
        }); 
      } 
 
      const { data, error } = await supabase 
        .from("user_collections") 
        .update({ status }) 
        .eq("user_id", userId) 
        .eq("item_id", itemId) 
        .select() 
        .single(); 
 
      if (error) throw error; 
 
      res.json({ success: true, data }); 

    } catch (err) { 
      next(err); 
    } 
  }, 
}; 
