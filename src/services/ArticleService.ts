import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types'; // Assuming Article type will be defined

export const articleService = {
  /**
   * Fetch all published articles, ordered by published_at descending.
   */
  async getArticles(): Promise<Article[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          author_name,
          image_url,
          tags,
          estimated_read_time,
          published_at,
          content_snippet:content, -- Select first N characters for snippet if desired, or handle in frontend
          author:profiles (full_name, profile_pic_url) -- Join with author's profile if author_id is present
        `)
        .is('published_at', 'not.null') // Ensure published_at is not null
        .lte('published_at', new Date().toISOString()) // Ensure published_at is in the past or now
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }
      // Post-process content for snippet if selecting full content
      return (data || []).map(article => ({
        ...article,
        // Example: Create a snippet from the first 150 chars of content if full content was fetched
        // content: article.content ? article.content.substring(0, 150) + '...' : '',
      })) as Article[];
    } catch (error) {
      console.error('Error in articleService.getArticles:', error);
      throw error;
    }
  },

  /**
   * Fetch a single article by its slug.
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles (full_name, profile_pic_url) -- Join with author's profile
        `)
        .eq('slug', slug)
        .is('published_at', 'not.null')
        .lte('published_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // PostgREST error for "single row not found"
          console.warn(`Article with slug "${slug}" not found or not published.`);
          return null;
        }
        console.error('Error fetching article by slug:', error);
        throw error;
      }
      return data as Article | null;
    } catch (error) {
      console.error('Error in articleService.getArticleBySlug:', error);
      throw error;
    }
  },
};

export default articleService;
